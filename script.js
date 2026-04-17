// --- TAB SWITCHING LOGIC ---
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // 1. Remove the active class from ALL tabs
        tabs.forEach(t => t.classList.remove('active'));
        
        // 2. Add the active class to the tab that was just clicked
        tab.classList.add('active');

        // 3. Find out which content ID this tab points to
        const targetId = tab.getAttribute('data-target');

        // 4. Hide all table bodies
        tabContents.forEach(content => content.classList.remove('active'));

        // 5. Show the correct table body
        document.getElementById(targetId).classList.add('active');
    });
});

// Grab the modal overlay and buttons
const modal = document.getElementById('overviewModal');
const viewButtons = document.querySelectorAll('.btn-view');
const closeBtn = document.querySelector('.btn-close-modal');
const cancelBtn = document.querySelector('.btn-cancel');

// Open modal when any "View" button is clicked
viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modal.classList.add('active');
    });
});

// Close modal when "X" is clicked
closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// Close modal when "Cancel Reservation" is clicked
cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// Close modal if clicking outside the white box
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});