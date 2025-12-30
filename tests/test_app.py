from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_root_redirects_to_static_index():
    response = client.get("/", follow_redirects=False)
    assert response.status_code in (301, 302, 307, 308)
    assert "/static/index.html" in response.headers.get("location", "")


def test_get_activities_returns_all():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    # Should contain at least one known activity key
    assert "Chess Club" in data


def test_signup_for_activity_adds_participant():
    activity_name = "Chess Club"
    test_email = "newstudent@mergington.edu"

    # Ensure email not present before
    activities[activity_name]["participants"] = [
        p for p in activities[activity_name]["participants"] if p != test_email
    ]

    response = client.post(f"/activities/{activity_name}/signup", params={"email": test_email})

    assert response.status_code == 200
    data = response.json()
    assert test_email in activities[activity_name]["participants"]
    assert "Signed up" in data.get("message", "")


def test_signup_for_activity_duplicate_rejected():
    activity_name = "Chess Club"
    test_email = "duplicatestudent@mergington.edu"

    # Ensure email present once
    participants = activities[activity_name]["participants"]
    if test_email not in participants:
        participants.append(test_email)

    response = client.post(f"/activities/{activity_name}/signup", params={"email": test_email})

    assert response.status_code == 400
    data = response.json()
    assert data.get("detail") == "Student already signed up for this activity"


def test_unregister_from_activity_removes_participant():
    activity_name = "Chess Club"
    test_email = "removeme@mergington.edu"

    # Ensure email present before removal
    participants = activities[activity_name]["participants"]
    if test_email not in participants:
        participants.append(test_email)

    response = client.delete(
        f"/activities/{activity_name}/participants", params={"email": test_email}
    )

    assert response.status_code == 200
    data = response.json()
    assert test_email not in activities[activity_name]["participants"]
    assert "Removed" in data.get("message", "")


def test_unregister_from_activity_not_found_when_missing():
    activity_name = "Chess Club"
    missing_email = "idontexist@mergington.edu"

    # Ensure email definitely not in participants
    activities[activity_name]["participants"] = [
        p for p in activities[activity_name]["participants"] if p != missing_email
    ]

    response = client.delete(
        f"/activities/{activity_name}/participants", params={"email": missing_email}
    )

    assert response.status_code == 404
    data = response.json()
    assert data.get("detail") == "Student not registered for this activity"
