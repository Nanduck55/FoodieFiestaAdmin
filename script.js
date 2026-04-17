let reservations = [
    {
        id: "RES-001",
        name: "Juan Dela Cruz",
        email: "juan@email.com",
        phone: "0917 123 4567",
        date: "2026-04-17",
        time: "17:30",
        guests: 4,
        requests: "Window seat near the corner, please. Birthday celebration.",
        status: "pending"
    },
    {
        id: "RES-002",
        name: "Maria Santos",
        email: "maria@email.com",
        phone: "0918 987 6543",
        date: "2026-04-18",
        time: "19:00",
        guests: 2,
        requests: "Quiet table.",
        status: "upcoming"
    }
];

let currentActiveReservationId = null;

// --- DOM ELEMENTS ---
const viewModal = document.getElementById('overviewModal');
const addModal = document.getElementById('addReservationModal');
const addForm = document.getElementById('addReservationForm');

// --- INITIALIZATION ---
function init() {
    renderTables();
    updateMetrics();
    setupEventListeners();
}

// --- RENDER LOGIC ---
function renderTables() {
    // Define mappings for target table bodies
    const tbodyMap = {
        'pending': document.getElementById('content-pending'),
        'upcoming': document.getElementById('content-upcoming'),
        'seated': document.getElementById('content-seated'),
        'completed': document.getElementById('content-completed'),
        'cancelled': document.getElementById('content-cancelled'),
        'all': document.getElementById('content-all')
    };

    // Clear existing DOM
    Object.values(tbodyMap).forEach(tbody => { if(tbody) tbody.innerHTML = ''; });

    // Build rows
    reservations.forEach(res => {
        const dateObj = new Date(res.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let [hours, minutes] = res.time.split(':');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        const rowHTML = `
            <tr data-id="${res.id}">
                <td>${res.name}</td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${res.guests} Guest</td>
                <td><span class="badge ${res.status}">${res.status.charAt(0).toUpperCase() + res.status.slice(1)}</span></td>
                <td><button class="btn-view">🔍 View</button></td>
            </tr>
        `;

        // Inject into specific status tab
        if (tbodyMap[res.status]) {
            tbodyMap[res.status].insertAdjacentHTML('beforeend', rowHTML);
        }
        // Inject into 'All' tab
        if (tbodyMap['all']) {
            tbodyMap['all'].insertAdjacentHTML('beforeend', rowHTML);
        }
    });
}

function updateMetrics() {
    // 1. Get exact local date in YYYY-MM-DD format to avoid UTC timezone bugs
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`; 

    let todayGuests = 0;
    let pendingCount = 0;
    let upcomingCount = 0;
    let upcomingReservations = [];

    reservations.forEach(res => {
        // Exclude cancelled/completed from the active counts
        if (res.status === 'cancelled' || res.status === 'completed') return;

        // Tally pending and upcoming 
        if (res.status === 'pending') pendingCount++;
        if (res.status === 'upcoming') upcomingCount++;
        
        // Count guests for TODAY (includes pending, upcoming, and seated)
        if (res.date === todayStr && (res.status === 'pending' || res.status === 'upcoming' || res.status === 'seated')) {
            // parseInt ensures we add numbers (4 + 2 = 6), not strings ("4" + "2" = "42")
            todayGuests += parseInt(res.guests || 0); 
        }

        // Track for the "Next Reservation" logic
        if (res.status === 'upcoming' || res.status === 'pending') {
            upcomingReservations.push(res);
        }
    });

    // Update DOM Metrics
    document.getElementById('metric-today').innerText = `${todayGuests} Guests`;
    document.getElementById('metric-pending').innerText = pendingCount;
    document.getElementById('metric-upcoming').innerText = upcomingCount;

    // Calculate Next Reservation
    if (upcomingReservations.length > 0) {
        // Sort by closest date and time
        upcomingReservations.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
        
        // Find the next one that is from today or the future
        const nextRes = upcomingReservations.find(r => new Date(`${r.date}T${r.time}`) >= new Date());
        
        if (nextRes) {
            let [hours, minutes] = nextRes.time.split(':');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            document.getElementById('metric-next').innerHTML = `${hours}:${minutes} ${ampm} | ${nextRes.guests} Guest`;
        } else {
            document.getElementById('metric-next').innerText = "None";
        }
    } else {
        document.getElementById('metric-next').innerText = "None";
    }
}

// --- MODAL CONTROLLER ---
function openViewModal(id) {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    
    currentActiveReservationId = id;

    // Populate Data
    document.getElementById('view-name').innerText = res.name;
    document.getElementById('view-phone').innerText = res.phone;
    document.getElementById('view-email').innerText = res.email;
    
    const dateObj = new Date(res.date);
    document.getElementById('view-date').innerText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let [hours, minutes] = res.time.split(':');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    document.getElementById('view-time').innerText = `${hours % 12 || 12}:${minutes} ${ampm}`;
    
    document.getElementById('view-guests').innerText = `${res.guests} Guest`;
    document.getElementById('view-requests').innerText = res.requests || "None";
    
    document.getElementById('view-status-badge').className = `badge ${res.status}`;
    document.getElementById('view-status-badge').innerText = res.status.charAt(0).toUpperCase() + res.status.slice(1);

    // Dynamic Actions based on status
    const footer = document.querySelector('#overviewModal .modal-footer');
    footer.innerHTML = ''; // Clear existing buttons

    if (res.status === 'pending') {
        footer.innerHTML = `
            <button class="btn-confirm" onclick="updateStatus('upcoming')">Confirm Reservation</button>
            <button class="btn-cancel" onclick="updateStatus('cancelled')">Cancel Reservation</button>
        `;
    } else if (res.status === 'upcoming') {
        footer.innerHTML = `
            <button class="btn-confirm" onclick="updateStatus('seated')">Mark as Seated</button>
            <button class="btn-cancel" onclick="updateStatus('cancelled')">Cancel Reservation</button>
        `;
    } else if (res.status === 'seated') {
        footer.innerHTML = `
            <button class="btn-confirm" onclick="updateStatus('completed')">Mark Completed</button>
        `;
    }

    viewModal.classList.add('active');
}

// Global scope function for inline onclick handlers in the dynamic buttons above
window.updateStatus = function(newStatus) {
    const index = reservations.findIndex(r => r.id === currentActiveReservationId);
    if (index !== -1) {
        reservations[index].status = newStatus;
        renderTables();
        updateMetrics();
        viewModal.classList.remove('active');
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    // Event Delegation for dynamically generated View buttons
    document.querySelector('.table-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-view')) {
            const row = e.target.closest('tr');
            const id = row.getAttribute('data-id');
            openViewModal(id);
        }
    });

    // Tab Switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Add Reservation Submissions
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRes = {
            id: `RES-${Date.now()}`, // Generate unique ID
            name: document.getElementById('addName').value,
            email: document.getElementById('addEmail').value,
            phone: document.getElementById('addPhone').value,
            date: document.getElementById('addDate').value,
            time: document.getElementById('addTime').value,
            guests: document.getElementById('addGuests').value,
            requests: document.getElementById('addRequests').value,
            status: "pending"
        };
        
        reservations.push(newRes);
        renderTables();
        updateMetrics();
        
        addForm.reset();
        addModal.classList.remove('active');
        
        // Auto-switch to Pending tab to show the new entry
        document.querySelector('.tab[data-target="content-pending"]').click();
    });

    // Modal Close Triggers
    document.querySelector('.btn-add-reservation').addEventListener('click', () => addModal.classList.add('active'));
    document.getElementById('closeAddModal').addEventListener('click', () => addModal.classList.remove('active'));
    document.querySelector('#overviewModal .btn-close-modal').addEventListener('click', () => viewModal.classList.remove('active'));
    
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) viewModal.classList.remove('active');
        if (e.target === addModal) addModal.classList.remove('active');
    });
}

// Boot the application
init();
