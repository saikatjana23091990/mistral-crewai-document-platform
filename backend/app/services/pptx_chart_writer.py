from pptx.chart.data import CategoryChartData

def update_pptx_charts(prs, charts_data):
    """
    charts_data format:
    [
      {
        "chart_ref": "shape0",
        "category": "Week 12",
        "series": {
          "Comparator": 34,
          "PRODUCT": 71
        }
      }
    ]
    """
    if not charts_data:
        return

    # Group updates by shape_id
    updates_by_shape = {}
    for cdata in charts_data:
        shape_id_str = cdata.get("chart_ref", "")
        if not shape_id_str.startswith("shape"):
            continue
        try:
            shape_idx = int(shape_id_str.replace("shape", ""))
            if shape_idx not in updates_by_shape:
                updates_by_shape[shape_idx] = []
            updates_by_shape[shape_idx].append(cdata)
        except ValueError:
            pass

    for slide in prs.slides:
        for s_idx, shape in enumerate(slide.shapes):
            if s_idx in updates_by_shape and shape.has_chart:
                chart = shape.chart
                new_data = updates_by_shape[s_idx]
                
                # Reconstruct the ChartData object
                chart_data = CategoryChartData()
                
                # Get existing categories and series names
                # It's better to preserve order
                existing_categories = [c.label for c in chart.plots[0].categories]
                existing_series = [s.name for s in chart.series]
                
                # If new data provides categories, we use those, but usually we just update existing
                # The data structure is a list of category points
                
                # Collect categories
                cat_names = []
                for point in new_data:
                    c = point.get("category")
                    if c and c not in cat_names:
                        cat_names.append(c)
                
                # Fallback to existing if not provided
                if not cat_names:
                    cat_names = existing_categories
                    
                chart_data.categories = cat_names
                
                # Add series
                for series_name in existing_series:
                    series_values = []
                    for cat in cat_names:
                        # Find the point
                        val = None
                        for point in new_data:
                            if point.get("category") == cat or len(cat_names) == 1:
                                series_dict = point.get("series", {})
                                val = series_dict.get(series_name, 0)
                                break
                        series_values.append(val)
                    chart_data.add_series(series_name, tuple(series_values))
                
                # Replace the data
                shape.chart.replace_data(chart_data)
