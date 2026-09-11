import sys
import asyncio

sys.path.append("/home/pruthvi/projects/signvision/Signvision/backend")
from app.services.word_lookup import word_lookup_service

def run():
    word_lookup_service.initialize()
    print("Testing word: B")
    r1 = word_lookup_service.lookup("B", use_semantic_fallback=False)
    print("lookup('B'):", r1.to_dict())
    
    print("\nTesting word XYZ (should fallback character by character)")
    seq = word_lookup_service.lookup_gloss_sequence(["XYZ"])
    for s in seq:
        print(s.to_dict())

    print("\nTesting semantic search fallback directly for 'XYZ'")
    r2 = word_lookup_service.lookup("XYZ", use_semantic_fallback=True)
    print("lookup('XYZ'):", r2.to_dict())

if __name__ == "__main__":
    run()
