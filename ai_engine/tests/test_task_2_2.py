import sys
import os

# Add parent to path so gmm_engine can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import gmm_engine

def test_compute_search_targets():
    mock_group_clusters = [
        {'energy': 0.8, 'acousticness': 0.2, 'danceability': 0.7},
        {'energy': 0.6, 'acousticness': 0.1, 'danceability': 0.8}
    ]
    mock_primary_user_limits = {'max_acousticness': 0.15}

    try:
        result = gmm_engine.compute_search_targets(mock_group_clusters, mock_primary_user_limits)
    except AttributeError:
        print("Task 2.2 Live Verification Failed: gmm_engine.py does not have 'compute_search_targets' function.")
        sys.exit(1)
    except Exception as e:
        print(f"Task 2.2 Live Verification Failed during execution: {e}")
        sys.exit(1)

    if not isinstance(result, dict) or 'safe' not in result or 'discovery' not in result:
        print("Task 2.2 Live Verification Failed: compute_search_targets must return a dict with 'safe' and 'discovery' keys.")
        sys.exit(1)
        
    safe_targets = result['safe']
    
    # Mathematical average of energy: (0.8+0.6)/2 = 0.7
    if abs(safe_targets.get('energy', 0) - 0.7) > 0.01:
        print(f"Task 2.2 Live Verification Failed: Expected safe energy to be 0.7, got {safe_targets.get('energy')}")
        sys.exit(1)
        
    print("Task 2.2 Live Verification Passed!")
    
if __name__ == "__main__":
    test_compute_search_targets()
