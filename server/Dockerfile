FROM python:3.10.1

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV GENSIM_DATA_DIR /app/data/gensim

RUN python -m pip install --upgrade pip
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

EXPOSE 5000

COPY ./data/gensim data/gensim
COPY . .

CMD ["python3", "-m", "gunicorn", "--bind", "0.0.0.0:80", "--timeout", "600", "wsgi:app"]