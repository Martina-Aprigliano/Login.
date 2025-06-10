// Supabase Configuration
const SUPABASE_URL = 'https://bjsppgxzcmghoyqojsqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqc3BwZ3h6Y21naG95cW9qc3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Nzg2NjgsImV4cCI6MjA2NTA1NDY2OH0.pD32cl2juICKrKmpx2GmAh0Fru77yZwcRP5S91nGmSY';

const { createClient } = supabase; // Ensure Supabase is available from CDN
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const adminSection = document.getElementById('admin-section');
const loginContainer = document.getElementById('login-container');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Admin email (for demonstration purposes)
const ADMIN_EMAIL = 'admin@example.com';

// Function to display error messages
function showErrorMessage(message) {
    let errorElement = document.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('p');
        errorElement.classList.add('error-message');
        // Insert error message before the first element in the login form, or adjust as needed
        loginForm.insertBefore(errorElement, loginForm.firstChild);
    }
    errorElement.textContent = message;
}

function clearErrorMessage() {
    const errorElement = document.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

// Event Listener for Login Form
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrorMessage();
    const email = emailInput.value;
    const password = passwordInput.value;

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error('Error logging in:', error.message);
        showErrorMessage('Login failed: ' + error.message);
        return;
    }

    if (data.user) {
        console.log('Logged in user:', data.user);
        loginContainer.style.display = 'none';
        logoutButton.style.display = 'block';

        if (data.user.email === ADMIN_EMAIL) {
            adminSection.style.display = 'block';
        } else {
            // For non-admin users, you can show a generic welcome message
            // or redirect them. For now, just log and don't show admin section.
            console.log('User is not admin.');
            // Example: Display a user-specific message area
            let userMessage = document.getElementById('user-message');
            if(!userMessage) {
                userMessage = document.createElement('div');
                userMessage.id = 'user-message';
                // Insert it after admin section, or a more appropriate place
                document.body.insertBefore(userMessage, logoutButton.nextSibling);
            }
            userMessage.innerHTML = `<p>Welcome, ${data.user.email}!</p>`;
            userMessage.style.display = 'block';

        }
    }
});

// Event Listener for Logout Button
logoutButton.addEventListener('click', async () => {
    clearErrorMessage();
    const { error } = await _supabase.auth.signOut();

    if (error) {
        console.error('Error logging out:', error.message);
        showErrorMessage('Logout failed: ' + error.message);
        return;
    }

    loginContainer.style.display = 'block'; // Or 'flex' if it was originally
    logoutButton.style.display = 'none';
    adminSection.style.display = 'none';

    const userMessage = document.getElementById('user-message');
    if (userMessage) {
        userMessage.style.display = 'none';
    }

    emailInput.value = '';
    passwordInput.value = '';
    console.log('Logged out successfully');
});

// Function to create admin user if not exists
async function createAdminUserIfNotExists(email, password) {
    // First, try to sign in with the credentials to see if the user exists
    // and to prevent re-creating or erroring if signup is attempted for an existing verified user.
    // This is a simple check; Supabase doesn't have a direct "check if user exists" without admin rights.
    // A common pattern is to attempt login, if fails with "Invalid login credentials", user might exist or not.
    // If it fails with other specific errors, or if signup fails with "User already registered", then it exists.

    // For simplicity, we'll directly attempt a sign-up.
    // Supabase signUp will return an error if the user already exists and is verified.
    // If the user exists but is not verified, it might resend a confirmation email.
    console.log(`Attempting to create admin user: ${email}`);
    const { data, error } = await _supabase.auth.signUp({
        email: email,
        password: password,
        // options: { data: { is_admin: true } } // Example of adding custom data if needed
    });

    if (error) {
        // Common error for existing user: "User already registered"
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
            console.log(`Admin user ${email} likely already exists: ${error.message}`);
        } else {
            console.error('Error trying to create admin user:', error.message);
        }
    } else if (data.user) {
        console.log(`Admin user ${email} created successfully or was already partially signed up. User ID: ${data.user.id}`);
        // If email confirmation is required, this user needs to be verified.
        // For testing, you might want to disable email confirmation in Supabase settings.
        if (data.session) {
             console.log("Admin user session created immediately (auto-confirm is likely on).");
        } else {
             console.log("Admin user created, but may require email confirmation.");
        }
    } else {
        console.log("No user data returned from signUp, but no error. This state is unusual for admin creation.");
    }
}

 // Check initial session state
 async function checkSession() {
     const { data: { session } } = await _supabase.auth.getSession();
     if (session) {
         console.log('Active session found:', session);
         loginContainer.style.display = 'none';
         logoutButton.style.display = 'block';
         if (session.user.email === ADMIN_EMAIL) {
             adminSection.style.display = 'block';
         } else {
             let userMessage = document.getElementById('user-message');
             if(!userMessage) {
                 userMessage = document.createElement('div');
                 userMessage.id = 'user-message';
                 document.body.insertBefore(userMessage, logoutButton.nextSibling);
             }
             userMessage.innerHTML = `<p>Welcome back, ${session.user.email}!</p>`;
             userMessage.style.display = 'block';
         }
     } else {
         console.log('No active session.');
         loginContainer.style.display = 'block'; // Or 'flex'
         logoutButton.style.display = 'none';
         adminSection.style.display = 'none';
     }
 }

 // Call checkSession on page load
 document.addEventListener('DOMContentLoaded', async () => { // Make it async
     // Ensure Supabase client is loaded if script is in head
     if (typeof supabase !== 'undefined') {
         await createAdminUserIfNotExists(ADMIN_EMAIL, 'exemple'); // Use ADMIN_EMAIL const
         await checkSession(); // Ensure checkSession is also awaited if it's async
     } else {
         // Adjust fallback if necessary, though createAdmin might not run here
         // Or ensure Supabase is loaded before this logic if it's critical path
         window.addEventListener('load', async () => { // Make it async
              await createAdminUserIfNotExists(ADMIN_EMAIL, 'exemple');
              await checkSession();
         });
     }
 });
