import safetensors.torch
import sys
f = safetensors.torch.load_file(sys.argv[1], device="cpu")
keys = list(f.keys())
print("Total keys:", len(keys))
with open("/tmp/keys.txt", "w") as out:
    for k in keys:
        out.write(k + "\n")
