import safetensors.torch
import sys

f = safetensors.torch.load_file(sys.argv[1], device="cpu")
keys = list(f.keys())
print("Total keys:", len(keys))
has_clip_g = any("conditioner.embedders.0" in k for k in keys)
has_clip_l = any("conditioner.embedders.1" in k for k in keys)
print("Has SDXL clip_g:", has_clip_g)
print("Has SDXL clip_l:", has_clip_l)
print("First 10 keys:", keys[:10])
