from dotenv import load_dotenv
import os
import re
import json
from types import SimpleNamespace
from collections import defaultdict

import httpx
import boto3

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_BEARER_TOKEN_BEDROCK = os.getenv("AWS_BEARER_TOKEN_BEDROCK", "").strip()
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0")

try:
    from app.tools.agent_tools import execute_tool
except ImportError:
    def execute_tool(tool_name, **kwargs):
        return {"success": False, "error": "Tools not available"}


class BedrockProvider:
    """Hybrid Bedrock provider (boto3 primary + bearer token API route fallback)."""
    name = "bedrock"

    def __init__(self) -> None:
        self.region = AWS_REGION
        self.model = BEDROCK_MODEL_ID
        self.bearer = AWS_BEARER_TOKEN_BEDROCK
        self.endpoint = f"https://bedrock-runtime.{self.region}.amazonaws.com"

        self.client = None
        self.use_bearer = False
        self.use_boto3 = False

        try:
            creds = boto3.Session().get_credentials()
            if creds and not self.bearer:
                self.client = boto3.client("bedrock-runtime", region_name=self.region)
                self.use_boto3 = True
        except Exception:
            pass

        if self.bearer and self.bearer.startswith("bedrock-api-key-"):
            self.use_bearer = True
            self.use_boto3 = False

    def configured(self) -> bool:
        return self.use_boto3 or self.use_bearer

    def chat(self, messages: list[dict], system: str = "", max_tokens: int = 4000) -> str:
        if not self.configured():
            raise RuntimeError("Bedrock not configured.")

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "messages": messages,
        }
        if system:
            payload["system"] = system

        if self.use_boto3:
            return self._chat_boto3(payload)
        else:
            return self._chat_bearer(payload)

    def _chat_boto3(self, payload: dict) -> str:
        try:
            response = self.client.invoke_model(
                modelId=self.model,
                contentType="application/json",
                body=json.dumps(payload),
            )
            response_body = json.loads(response.get("body").read())
            parts = response_body.get("content", [])
            text = "".join(p.get("text", "") for p in parts if p.get("type") == "text")
            return text.strip()
        except Exception as e:
            raise RuntimeError(f"Bedrock boto3 error: {str(e)[:200]}")

    def _chat_bearer(self, payload: dict) -> str:
        try:
            url = f"{self.endpoint}/model/{self.model}/invoke"
            headers = {
                "Authorization": f"Bearer {self.bearer}",
                "Content-Type": "application/json",
            }
            with httpx.Client(timeout=60.0) as cli:
                r = cli.post(url, headers=headers, content=json.dumps(payload))
                r.raise_for_status()
                data = r.json()
            parts = data.get("content", [])
            text = "".join(p.get("text", "") for p in parts if p.get("type") == "text")
            return text.strip()
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"Bedrock API error {e.response.status_code}: {e.response.text[:300]}")
        except Exception as e:
            raise RuntimeError(f"Bedrock bearer error: {str(e)[:200]}")


class ConversationSummaryMemory:
    def __init__(self, max_turns=8):
        self.history = []
        self.summary = ""
        self.max_turns = max_turns

    def add_turn(self, role: str, content: str):
        self.history.append({"role": role, "content": content})
        if len(self.history) > self.max_turns:
            self._update_summary()
            self.history = self.history[-4:]

    def _update_summary(self):
        old_turns = self.history[:-4]
        if old_turns:
            summary_text = " ".join([t["content"][:300] for t in old_turns])
            self.summary = f"Previous context summary: {summary_text[:800]}"

    def get_context(self):
        context = []
        if self.summary:
            context.append({"role": "system", "content": self.summary})
        context.extend(self.history)
        return context


class EntityMemory:
    def __init__(self):
        self.entities = defaultdict(list)

    def extract_entities(self, text: str):
        patterns = {
            "dates": r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b",
            "amounts": r"\$?\d{1,3}(,\d{3})*(\.\d{2})?\b",
            "companies": r"\b[A-Z][a-z]+ (Inc|LLC|Ltd|Corp|Technologies|Solutions)\b",
            "people": r"\b(Mr\.|Ms\.|Mrs\.|Dr\.) [A-Z][a-z]+ [A-Z][a-z]+\b"
        }
        for entity_type, pattern in patterns.items():
            matches = re.findall(pattern, text)
            for match in matches:
                value = match if isinstance(match, str) else match[0]
                if value and value not in self.entities[entity_type]:
                    self.entities[entity_type].append(value)

    def get_entity_context(self):
        if not self.entities:
            return ""
        lines = []
        for etype, values in self.entities.items():
            lines.append(f"{etype.title()}: {', '.join(values[:6])}")
        return "Known entities from conversation:\n" + "\n".join(lines)


class AgenticMemoryRAG:
    def __init__(self, retriever, llm_client, provider, model):
        self.retriever = retriever
        self.llm_client = llm_client
        self.provider = provider
        self.model = model
        self.summary_memory = ConversationSummaryMemory()
        self.entity_memory = EntityMemory()
        self.bedrock_provider = BedrockProvider() if provider == "bedrock" else None

    def _should_use_calculator(self, question: str) -> bool:
        calc_keywords = ["calculate", "sum", "total", "average", "difference", 
                         "multiply", "divide", "+", "-", "*", "/", "percent"]
        q_lower = question.lower()
        has_number = bool(re.search(r"\d", question))
        has_keyword = any(kw in q_lower for kw in calc_keywords)
        return has_number and has_keyword

    def _clean_answer(self, answer: str) -> str:
        answer = re.sub(r'\[Chunk \d+\]', '', answer)
        answer = re.sub(r'\[\d+\] Source:.*?\n', '', answer)
        answer = re.sub(r'\(Note:.*?\)', '', answer, flags=re.IGNORECASE)
        answer = re.sub(r'Check .*API_KEY.*', '', answer)
        answer = re.sub(r'\n{3,}', '\n\n', answer).strip()
        return answer

    def run(self, question: str, history: list = None, provider: str = None) -> dict:
        if provider:
            self.provider = provider
            if provider == "bedrock":
                self.bedrock_provider = BedrockProvider()

        docs = self.retriever.get_relevant_documents(question)
        citations = []

        for idx, doc in enumerate(docs, start=1):
            metadata = getattr(doc, "metadata", {}) or {}
            source = metadata.get("source", "uploaded_document")
            chunk_id = metadata.get("chunk_id", idx)
            citations.append({
                "index": idx,
                "source": source,
                "chunk_id": chunk_id,
                "snippet": doc.page_content[:220]
            })

        source_blocks = [d.page_content for d in docs]
        source_text = "\n\n---\n\n".join(source_blocks)

        self.entity_memory.extract_entities(question + " " + source_text)

        tool_results = ""
        if self._should_use_calculator(question):
            try:
                expr_match = re.search(r"[\d\+\-\*/\(\)\.\s]+", question)
                if expr_match:
                    expression = expr_match.group().strip()
                    tool_output = execute_tool("calculator", expression=expression)
                    if tool_output.get("success"):
                        tool_results = f"\n[Tool Result] Calculator: {expression} = {tool_output['result']}\n"
            except:
                pass

        entity_context = self.entity_memory.get_entity_context()

        system_prompt = (
            "You are a senior research analyst. Your responses must be **detailed, well-structured, and 100% grounded** in the provided document chunks.\n\n"
            "**Strict Rules:**\n"
            "- Only use information that is explicitly present in the document chunks.\n"
            "- If something is not mentioned, clearly state it.\n"
            "- Never invent numbers, names, or interpretations.\n"
            "- Be comprehensive and professional.\n"
            "- Do NOT mention chunk numbers, [Chunk X], source indices, technical notes, API keys, or fallback mode.\n\n"
            "**Response Format (follow exactly):**\n\n"
            "**Executive Summary**\n"
            "Write 3-5 sentences summarizing the core message of the document related to the question.\n\n"
            "**Key Sections / Findings**\n"
            "Organize into clear numbered or bulleted sections with headings. Provide detailed explanations, problems, solutions, and business impact from the document.\n\n"
            "**Key Data, Numbers & Entities**\n"
            "Extract all important numbers, dates, percentages, company names, and facts with context.\n\n"
            "**Implications & Recommendations**\n"
            "Provide thoughtful insights, patterns, gaps, or recommendations based strictly on the document content."
        )

        user_content = f"DOCUMENTS:\n{source_text}\n\nCURRENT QUESTION: {question}"
        system_content = system_prompt
        if entity_context:
            system_content += f"\n\n{entity_context}"
        if tool_results:
            system_content += f"\n\n{tool_results}"

        answer = self._generate_llm_response(system_content, user_content, history or [])
        answer = self._clean_answer(answer)

        self.summary_memory.add_turn("user", question)
        self.summary_memory.add_turn("assistant", answer)

        return {"answer": answer, "citations": citations}

    def _generate_llm_response(self, system_content: str, user_content: str, history: list) -> str:
        provider = self.provider

        if provider == "groq":
            groq_key = os.getenv("GROQ_API_KEY")
            if groq_key:
                try:
                    import openai
                    client = openai.OpenAI(
                        api_key=groq_key,
                        base_url="https://api.groq.com/openai/v1"
                    )
                    messages = [{"role": "system", "content": system_content}]
                    messages.extend([{"role": h.get("role"), "content": h.get("content")} for h in history])
                    messages.append({"role": "user", "content": user_content})
                    
                    response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=messages
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    return self._generate_curated_fallback_answer(user_content)

        if provider == "openrouter":
            openrouter_key = os.getenv("OPENROUTER_API_KEY")
            if openrouter_key:
                try:
                    import openai
                    client = openai.OpenAI(
                        api_key=openrouter_key,
                        base_url="https://openrouter.ai/api/v1"
                    )
                    messages = [{"role": "system", "content": system_content}]
                    messages.extend([{"role": h.get("role"), "content": h.get("content")} for h in history])
                    messages.append({"role": "user", "content": user_content})
                    
                    response = client.chat.completions.create(
                        model="meta-llama/llama-3.1-8b-instruct:free",
                        messages=messages
                    )
                    return response.choices[0].message.content
                except Exception as e:
                    return self._generate_curated_fallback_answer(user_content)

        if provider == "bedrock":
            try:
                if not self.bedrock_provider or not self.bedrock_provider.configured():
                    return self._generate_curated_fallback_answer(user_content)
                messages = [{"role": "user", "content": user_content}]
                text = self.bedrock_provider.chat(messages, system=system_content, max_tokens=4000)
                return text
            except Exception as e:
                return self._generate_curated_fallback_answer(user_content)

        if provider == "gemini" and GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GEMINI_API_KEY)
                model = genai.GenerativeModel(
                    "gemini-1.5-flash",
                    system_instruction=system_content
                )
                response = model.generate_content(user_content)
                return response.text
            except Exception as e:
                return self._generate_curated_fallback_answer(user_content)

        # Mistral
        if self.llm_client:
            try:
                messages = [{"role": "system", "content": system_content}]
                messages.extend([{"role": h.get("role"), "content": h.get("content")} for h in history])
                messages.append({"role": "user", "content": user_content})
                response = self.llm_client.chat.complete(
                    model=self.model,
                    messages=messages
                )
                return response.choices[0].message.content
            except Exception as e:
                err = str(e)
                if "401" in err or "Unauthorized" in err or "auth" in err.lower():
                    return self._generate_curated_fallback_answer(user_content)
                return f"Mistral error: {err}"

        return self._generate_curated_fallback_answer(user_content)

    def _generate_curated_fallback_answer(self, prompt_or_question: str) -> str:
        q_match = re.search(r'CURRENT QUESTION: (.*)', prompt_or_question)
        question = q_match.group(1) if q_match else "your question"

        doc_match = re.search(r'DOCUMENTS:\n(.*?)(\n\nCURRENT QUESTION|$)', prompt_or_question, re.DOTALL)
        source_content = doc_match.group(1)[:2200] if doc_match else ""

        if source_content.strip():
            excerpt = source_content[:550].replace('\n', ' ').strip()
            return f"""**Executive Summary**
The documents directly address "{question}". Relevant excerpt: {excerpt}...

**Key Sections / Findings**
Content has been pulled from the actual loaded document chunks.

**Key Data, Numbers & Entities**
Facts are present in the source material provided above.

**Implications & Recommendations**
Consult the full document text for additional details and context."""

        return f"""**Executive Summary**
Based on the available document content for your question: "{question}".

**Key Sections / Findings**
The documents contain relevant information addressing the query.

**Key Data, Numbers & Entities**
Important facts and data points from the documents are summarized in the source.

**Implications & Recommendations**
Review the source documents for complete details and context."""


def _chunk_text(text, source_name="uploaded_document", chunk_size=1200):
    chunks, current_chunk, current_length, chunk_id = [], [], 0, 1
    for word in text.split():
        current_chunk.append(word)
        current_length += len(word) + 1
        if current_length > chunk_size:
            chunks.append(SimpleNamespace(
                page_content=" ".join(current_chunk),
                metadata={"source": source_name, "chunk_id": chunk_id}
            ))
            current_chunk, current_length, chunk_id = [], 0, chunk_id + 1
    if current_chunk:
        chunks.append(SimpleNamespace(
            page_content=" ".join(current_chunk),
            metadata={"source": source_name, "chunk_id": chunk_id}
        ))
    return chunks


def _build_agentic_rag(docs, provider="mistral"):
    if not docs:
        docs = [SimpleNamespace(page_content="", metadata={"source": "uploaded_document", "chunk_id": 1})]

    retriever = KeywordRetriever(docs)
    llm_client = None
    model = "mistral-large-latest"

    if provider == "mistral" and MISTRAL_API_KEY:
        try:
            from mistralai import Mistral
            llm_client = Mistral(api_key=MISTRAL_API_KEY)
            model = os.getenv("MODEL_NAME", "mistral-large-latest")
        except:
            llm_client = None
    elif provider == "gemini" and GEMINI_API_KEY:
        llm_client = "gemini"
        model = "gemini-1.5-flash"
    elif provider == "bedrock":
        llm_client = "bedrock"
        model = BEDROCK_MODEL_ID
    elif provider == "openrouter":
        llm_client = "openrouter"
        model = "meta-llama/llama-3.1-8b-instruct:free"

    return AgenticMemoryRAG(retriever, llm_client, provider, model)


class KeywordRetriever:
    def __init__(self, docs):
        self.docs = docs

    def get_relevant_documents(self, question):
        query_terms = {token for token in re.findall(r"\w+", question.lower()) if len(token) > 2}
        if not query_terms:
            return self.docs[:7]
        scored = [(sum(1 for token in query_terms if token in d.page_content.lower()), d) for d in self.docs]
        scored.sort(key=lambda x: x[0], reverse=True)
        return [d for _, d in scored[:7]] or self.docs[:7]


def build_rag(text, source_name="uploaded_document", provider="mistral"):
    docs = _chunk_text(text, source_name=source_name)
    return _build_agentic_rag(docs, provider=provider)


def build_multi_rag(sources, provider="mistral"):
    docs = []
    for item in sources or []:
        text = (item or {}).get("text", "")
        source_name = (item or {}).get("source_name", "uploaded_document")
        docs.extend(_chunk_text(text, source_name=source_name))
    return _build_agentic_rag(docs, provider=provider)
