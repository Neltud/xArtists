FROM python:3.12-slim
WORKDIR /app
COPY services/pulse-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/pulse-api/main.py .
EXPOSE 8090
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8090"]
