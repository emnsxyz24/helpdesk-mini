from tests.config_test import client

PASSWORD = "Passowrd123!"

def register(client, business, email):
    body = {
        "business_name": business,
        "name" : "Boss",
        "email": email,
        "password": PASSWORD,
        }
    res = client.post("/auth/register-business", json=body)
    assert res.status_code == 201, res.text
    return {"Authorization": "Bearer " + res.json()["access_token"]}

def add_customer(client, admin_headers, email):
    body = {
        "name": "Customer",
        "email": email,
        "password": PASSWORD,
        "role" : "customer"
    }
    assert client.post("/users", json=body, headers=admin_headers).status_code == 201
    res = client.post("/auth/login", json={"email": email, "password": PASSWORD})
    return {"Authorization": "Bearer " + res.json()["access_token"]}

TICKET = {'subject': 'Help me', 'category': 'Billing', 'priority': 'high', 'message': 'Hello'}

def create_ticket(client, headers):
    res = client.post("/tickets", json=TICKET, headers=headers)
    assert res.status_code == 201, res.text
    return res.json()["id"]

def test_other_business_cannot_access_ticket(client):
    admin_a = register(client, "Business A", "admin@business-a.com")
    admin_b = register(client, "Business B", "admin@business-b.com")
    customer_a = add_customer(client, admin_a, "customer@business-a.com")
    ticket_id = create_ticket(client, customer_a)
    
    assert client.get(f"/tickets/{ticket_id}", headers=admin_b).status_code == 404
    assert client.get(f"/tickets/{ticket_id}/messages", headers=admin_b).status_code == 404
    patch = client.patch(f"/tickets/{ticket_id}", json={"status": "in_progress"}, headers=admin_b)
    assert patch.status_code == 404
    assert client.get("/tickets",headers=admin_b).json() == []
    assert client.get(f"/tickets/{ticket_id}",headers=admin_a).status_code == 200
    
def test_customer_cannot_access_another_customers_ticket(client):
    admin = register(client, "Business A", "admin@business-a.com")
    first = add_customer(client, admin, "first@business-a.com")
    second = add_customer(client, admin, "second@business-a.com")
    ticket_id = create_ticket(client, first)
    
    assert client.get(f"/tickets/{ticket_id}", headers=second).status_code == 404
    assert client.get("/tickets", headers=second).json() == []
    
def test_email_is_unique_per_business(client):
    register(client, "Business A", "admin@business-a.com")
    body = {"business_name": "Business B", "name": "Other", "email": "admin@business-a.com", "password": PASSWORD}
    
    assert client.post("/auth/register-business", json=body).status_code == 409
    
def test_auth_and_role_checks(client):
    assert client.get("/tickets").status_code == 401
    
    admin = register(client, "Business A", "admin@business-a.com")
    customer = add_customer(client, admin, "customer@business-a.com")
    
    assert client.get("/users", headers=customer).status_code == 403
    assert client.post("/tickets", json=TICKET, headers=admin).status_code == 403
    
def test_password_is_not_returned(client):
    admin = register(client, "Business A", "admin@business-a.com")
    assert "password" not in client.get("/auth/me", headers=admin).text
