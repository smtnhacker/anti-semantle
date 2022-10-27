FROM python:3.10.1

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

EXPOSE 5000

COPY . .

CMD ["python3", "-m", "flask", "run"]