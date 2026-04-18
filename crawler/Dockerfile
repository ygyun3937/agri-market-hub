FROM python:3.11-slim
WORKDIR /app
ENV PIP_PROGRESS_BAR=off
ENV PIP_NO_COLOR=1
COPY requirements.txt .
RUN pip install --no-cache-dir --no-color -r requirements.txt
COPY . .
CMD ["python", "main.py"]
