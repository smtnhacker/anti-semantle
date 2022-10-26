import gensim.downloader as api

model = api.load('glove-wiki-gigaword-50')
print(f"'france' and 'spain' has distance {model.similarity('france', 'spain')}")
