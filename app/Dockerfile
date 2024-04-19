
FROM python:3.7-alpine

WORKDIR /usr/src/app

COPY . .

RUN pip install mysql-connector-python
RUN pip install Flask

EXPOSE 5555

CMD ["python3", "api.py"]
