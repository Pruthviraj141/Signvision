import sys
sys.path.append("/home/pruthvi/projects/signvision/Signvision/backend")
from app.services.word_lookup import word_lookup_service

def test():
    word_lookup_service.initialize()
    
    test_cases = [
        "HELLO", "PRUTHVIRAJ", "ONKAR", "123", "A"
    ]
    
    for case in test_cases:
        print(f"\n--- Testing: '{case}' ---")
        try:
            results = word_lookup_service.lookup_gloss_sequence([case], use_semantic_fallback=False)
            for r in results:
                print(f"  Result -> word: {r.word}, found: {r.found}, match: {r.match_type}")
        except Exception as e:
            print(f"  ERROR: {e}")

test()
