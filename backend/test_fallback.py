import sys
import asyncio
import traceback

sys.path.append("/home/pruthvi/projects/signvision/Signvision/backend")

from app.services.word_lookup import word_lookup_service

def test():
    try:
        word_lookup_service.initialize()
        print('Initialized.')
        results = word_lookup_service.lookup_gloss_sequence(['PRUTHVIRAJ'])
        for r in results:
            print(r.to_dict())
    except Exception as e:
        traceback.print_exc()

test()
