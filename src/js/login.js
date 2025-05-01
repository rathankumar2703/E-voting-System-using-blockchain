document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('voter_id', document.getElementById('voter-id').value);
    formData.append('password', document.getElementById('password').value);

    try {
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('token', result.token);
            document.getElementById('loginMsg').innerText = 'Login successful!';
            document.getElementById('loginMsg').classList.add('text-success');
            const tokenPayload = JSON.parse(atob(result.token.split('.')[1]));
            setTimeout(() => {
                window.location.href = tokenPayload.role === 'admin' ? '/admin_dashboard.html' : '/vote.html';
            }, 2000);
        } else {
            throw new Error(result.detail || 'Login failed');
        }
    } catch (error) {
        document.getElementById('loginMsg').innerText = `Error: ${error.message}`;
        document.getElementById('loginMsg').classList.add('text-danger');
    }
});

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('role') === 'admin') {
    document.getElementById('voter-id').value = 'admin';
    document.querySelector('h1').innerText = 'Admin Login';
}