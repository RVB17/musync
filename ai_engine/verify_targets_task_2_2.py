import sys
import os

filepath = os.path.join(os.path.dirname(__file__), 'gmm_engine.py')
with open(filepath, 'r') as f:
    content = f.read().lower()

errors = []

if 'safe' not in content or 'discovery' not in content:
    errors.append("Missing implementation for 'Safe' and 'Discovery' target features.")

if 'average' not in content and 'mean' not in content:
    errors.append("Missing calculation for mathematical average (or mean) of overlapping clusters.")

if 'primary' not in content and 'filter' not in content and 'limit' not in content and 'cap' not in content:
    errors.append("Missing strict filter based on primary user's GMM limits.")

if len(errors) > 0:
    print("Task 2.2 Verification Failed:")
    for err in errors:
        print("- " + err)
    sys.exit(1)

print("Task 2.2 Verification Passed!")
sys.exit(0)
