from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "tempuser@example.com"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        resp_cleanup = client.delete(f"/activities/{activity}/signup", params={"email": email})
        assert resp_cleanup.status_code in (200, 400)

    # Sign up
    resp_signup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp_signup.status_code == 200
    assert email in activities[activity]["participants"]

    # Unregister
    resp_delete = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp_delete.status_code == 200
    assert email not in activities[activity]["participants"]


def test_unregister_nonexistent_participant_returns_400():
    activity = "Programming Class"
    email = "nonexistent@example.com"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp_delete = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp_delete.status_code == 400
    body = resp_delete.json()
    assert body.get("detail") == "Student is not registered for this activity"


def test_unregister_from_missing_activity_returns_404():
    resp_delete = client.delete("/activities/Unknown Activity/signup", params={"email": "someone@example.com"})
    assert resp_delete.status_code == 404
    body = resp_delete.json()
    assert body.get("detail") == "Activity not found"
