import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    # Ensure known activity is present
    assert 'Chess Club' in data
    assert 'participants' in data['Chess Club']


def test_signup_success_and_duplicate_prevention():
    activity = 'Chess Club'
    email = 'newstudent@mergington.edu'

    # Ensure cleanup if left over from previous runs
    if email in activities[activity]['participants']:
        activities[activity]['participants'].remove(email)

    resp = client.post(f'/activities/{activity}/signup', params={'email': email})
    assert resp.status_code == 200, resp.text
    assert email in activities[activity]['participants']

    # Duplicate should fail
    dup = client.post(f'/activities/{activity}/signup', params={'email': email})
    assert dup.status_code == 400
    assert dup.json()['detail'] == 'Student is already signed up'


def test_remove_participant_success_and_missing():
    activity = 'Programming Class'
    email = 'toremove@mergington.edu'

    # Guarantee participant exists
    if email not in activities[activity]['participants']:
        activities[activity]['participants'].append(email)

    # Remove participant
    rem_resp = client.delete(f'/activities/{activity}/participant', params={'email': email})
    assert rem_resp.status_code == 200, rem_resp.text
    assert email not in activities[activity]['participants']

    # Removing again should 404
    rem_missing = client.delete(f'/activities/{activity}/participant', params={'email': email})
    assert rem_missing.status_code == 404
    assert rem_missing.json()['detail'] in ['Participant not registered for this activity']


def test_remove_participant_activity_not_found():
    resp = client.delete('/activities/Unknown Activity/participant', params={'email': 'x@y.com'})
    assert resp.status_code == 404
    assert resp.json()['detail'] == 'Activity not found'
