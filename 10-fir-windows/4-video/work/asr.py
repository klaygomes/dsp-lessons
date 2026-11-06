import sys, transformers, torch
p = transformers.pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo", device="cpu", torch_dtype=torch.float32)
for f in sys.argv[1:]:
    r = p(f, return_timestamps="word", chunk_length_s=30, generate_kwargs={"language": "en"})
    print(f, " ".join(f'{c["timestamp"][0]:.2f}:{c["text"].strip()}' for c in r["chunks"]))
