document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('voter_id', document.getElementById('voter-id').value);
    formData.append('password', document.getElementById('password').value);
    formData.append('name', document.getElementById('name').value);
    formData.append('dob', document.getElementById('dob').value);
    formData.append('aadhaar', document.getElementById('aadhaar').value);
    formData.append('gender', document.getElementById('gender').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('image', document.getElementById('image').files[0]);

    try {
        const response = await fetch('http://127.0.0.1:8000/register', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('registerMsg').innerText = 'Registration successful!';
            document.getElementById('registerMsg').classList.add('text-success');
            setTimeout(() => window.location.href = '/login.html', 2000);
        } else {
            throw new Error(result.detail || 'Registration failed');
        }
    } catch (error) {
        document.getElementById('registerMsg').innerText = `Error: ${error.message}`;
        document.getElementById('registerMsg').classList.add('text-danger');
    }
});