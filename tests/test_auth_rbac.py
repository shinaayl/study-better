import unittest
from fastapi.testclient import TestClient
from backend.api.main import app
from backend.db.database import get_connection

class TestAuthRBAC(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_google_login_needs_onboarding_for_new_user_without_role(self):
        # A user logging in for the first time without having selected role/department
        res = self.client.post("/api/auth/google-login", json={
            "email": "fresh.user@university.edu.ng",
            "name": "Fresh Student"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("needs_onboarding"))
        self.assertEqual(data["google_profile"]["email"], "fresh.user@university.edu.ng")

    def test_complete_onboarding_creates_student_and_jwt(self):
        res = self.client.post("/api/auth/complete-onboarding", json={
            "email": "chioma.okonkwo@ui.edu.ng",
            "name": "Chioma Okonkwo",
            "role": "student",
            "department": "Computer Science",
            "institution": "University of Ibadan",
            "level": "400"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "student")
        self.assertEqual(data["user"]["department"], "Computer Science")

        # Verify persisted in SQLite
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?;", ("chioma.okonkwo@ui.edu.ng",))
        row = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row["role"], "student")

    def test_complete_onboarding_creates_lecturer(self):
        res = self.client.post("/api/auth/complete-onboarding", json={
            "email": "prof.ade@ui.edu.ng",
            "name": "Prof. Adebayo",
            "role": "lecturer",
            "department": "Economics",
            "institution": "University of Ibadan",
            "title": "Professor & Head of Department"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "lecturer")

    def test_rbac_student_blocked_from_upload(self):
        # Authenticate as student
        auth_res = self.client.post("/api/auth/complete-onboarding", json={
            "email": "student.blocked@ui.edu.ng",
            "name": "Student Blocked",
            "role": "student",
            "department": "Law"
        })
        token = auth_res.json()["access_token"]

        # Attempt to upload a course document as a student
        upload_res = self.client.post(
            "/api/courses/upload",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("test.txt", b"Mock document content", "text/plain")},
            data={"course_code": "LAW 101", "department": "Law"}
        )
        self.assertEqual(upload_res.status_code, 403)
        self.assertIn("Access denied", upload_res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
