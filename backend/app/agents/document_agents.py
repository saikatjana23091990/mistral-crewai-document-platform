from crewai import Agent
from crewai.llms.base_llm import BaseLLM
from dotenv import load_dotenv
import os
from mistralai import Mistral
from typing import Any

load_dotenv()

class GroqBaseLLM(BaseLLM):
    """CrewAI-compatible Groq LLM implementation using OpenAI client."""
    model: str
    api_key: str
    provider: str = "groq"

    def __init__(self, **data: Any):
        super().__init__(**data)
        import openai
        self.client = openai.OpenAI(
            api_key=self.api_key,
            base_url="https://api.groq.com/openai/v1"
        )

    def _prepare_messages(self, messages: str | list[dict[str, str]]) -> list[dict[str, str]]:
        if isinstance(messages, str):
            return [{"role": "user", "content": messages}]
        if isinstance(messages, list):
            cleaned_messages = []
            for msg in messages:
                cleaned_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            return cleaned_messages
        raise ValueError("Messages must be a string or a list of message dictionaries")

    def call(
        self,
        messages: str | list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callbacks: list[Any] | None = None,
        available_functions: dict[str, Any] | None = None,
        from_task: Any | None = None,
        from_agent: Any | None = None,
        response_model: Any | None = None,
    ) -> str | Any:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=self._prepare_messages(messages)
        )
        return response.choices[0].message.content

    async def acall(
        self,
        messages: str | list[dict[str, str]],
        tools: list[dict[str, Any]] | None = None,
        callbacks: list[Any] | None = None,
        available_functions: dict[str, Any] | None = None,
        from_task: Any | None = None,
        from_agent: Any | None = None,
        response_model: Any | None = None,
    ) -> str | Any:
        return self.call(
            messages=messages,
            tools=tools,
            callbacks=callbacks,
            available_functions=available_functions,
            from_task=from_task,
            from_agent=from_agent,
            response_model=response_model,
        )

llm = GroqBaseLLM(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY", "your-groq-key-here")
)

# Create agents with Mistral model
extractor_agent = Agent(
    role="Document Extraction Expert",
    goal="Extract all information without omission",
    backstory="Expert enterprise document parser",
    verbose=True,
    llm=llm
)

normalizer_agent = Agent(
    role="Data Normalizer",
    goal="Map varying source formats into canonical fields consistently",
    backstory="Expert at parsing extracted data and normalizing fields across different templates",
    verbose=True,
    llm=llm
)

formatter_agent = Agent(
    role="Document Formatter",
    goal="Transform source data into target structure",
    backstory="Expert in formatting and structured conversion",
    verbose=True,
    llm=llm
)

validator_agent = Agent(
    role="Validation Auditor",
    goal="Detect hallucinations and missing data",
    backstory="Expert AI quality auditor",
    verbose=True,
    llm=llm
)