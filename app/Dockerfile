FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=5555
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements-mysql.txt
COPY . .
RUN useradd --create-home carls && mkdir -p /app/instance && chown -R carls:carls /app
USER carls
EXPOSE 5555
CMD ["sh", "-c", "exec gunicorn --no-control-socket --bind 0.0.0.0:${PORT:-5555} --workers 1 --threads 50 --timeout 120 --access-logfile - api:app"]
