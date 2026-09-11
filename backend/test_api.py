import sys
sys.path.append("/home/pruthvi/projects/signvision/Signvision/backend")
from app.services.word_lookup import word_lookup_service

def test():
    word_lookup_service.initialize()
    print("Testing word_lookup for ONKAR")
    results = word_lookup_service.lookup_gloss_sequence(["ONKAR"])
    for r in results:
        print(f"Word: {r.word}, URL: {r.s3_url}, Match: {r.match_type}")
        
test()
