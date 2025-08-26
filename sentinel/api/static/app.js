/** Sentinel One Lite Web UI Application Logic */

// Global variables
let currentSection = 'dashboard';
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sentinel One Lite Web UI Initializing...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    loadDashboardData();
    
    // Set up auto-refresh
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    
    console.log('✅ Web UI Initialized Successfully!');
});

// Set up event listeners
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadDashboardData();
        showNotification('Data refreshed successfully!', 'success');
    });
    
    // Add host form
    document.getElementById('addHostForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addHost();
    });
    
    // Add rule form
    document.getElementById('addRuleForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addRule();
    });
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.remove('hidden');
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-50', 'text-blue-600');
    });
    
    // Highlight current section button
    event.target.classList.add('bg-blue-50', 'text-blue-600');
    
    // Load section data
    currentSection = sectionName;
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'hosts':
            loadHosts();
            break;
        case 'events':
            loadEvents();
            break;
        case 'rules':
            loadRules();
            break;
        case 'alerts':
            loadAlerts();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load dashboard stats
        const stats = await fetchAPI('/api/dashboard');
        updateDashboardStats(stats);
        
        // Load hosts for filters
        const hosts = await fetchAPI('/api/hosts');
        updateHostFilters(hosts);
        
        // Update recent activity
        updateRecentActivity();
        
        // Update last update time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        
        console.log('✅ Dashboard data loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalHosts').textContent = stats.total_hosts || 0;
    document.getElementById('totalEvents').textContent = stats.total_events || 0;
    document.getElementById('totalRules').textContent = stats.total_rules || 0;
    document.getElementById('totalAlerts').textContent = stats.total_alerts || 0;
}

function updateHostFilters(hosts) {
    const hostFilter = document.getElementById('hostFilter');
    if (hostFilter) {
        hostFilter.innerHTML = '<option value="">All Hosts</option>';
        hosts.forEach(host => {
            const option = document.createElement('option');
            option.value = host.id;
            option.textContent = host.hostname;
            hostFilter.appendChild(option);
        });
    }
}

function updateRecentActivity() {
    const recentActivityDiv = document.getElementById('recentActivity');
    if (recentActivityDiv) {
        recentActivityDiv.innerHTML = `
            <p>✅ Dashboard updated at ${new Date().toLocaleTimeString()}</p>
            <p>🔄 Auto-refresh enabled</p>
            <p>📊 Data loaded successfully</p>
        `;
    }
}

// Host management functions
async function loadHosts() {
    try {
        console.log('🏠 Loading hosts...');
        const hosts = await fetchAPI('/api/hosts');
        updateHostsTable(hosts);
    } catch (error) {
        console.error('❌ Error loading hosts:', error);
        showNotification('Error loading hosts', 'error');
    }
}

function updateHostsTable(hosts) {
    const tbody = document.getElementById('hostsTable');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (hosts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No hosts found</td></tr>';
            return;
        }
        
        hosts.forEach(host => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${host.hostname}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${host.platform}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${host.os_version || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDateTime(host.last_seen)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editHost(${host.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button onclick="deleteHost(${host.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

async function addHost() {
    const hostname = document.getElementById('hostname').value;
    const platform = document.getElementById('platform').value;
    const osVersion = document.getElementById('osVersion').value;
    
    try {
        const host = await fetchAPI('/api/hosts', {
            method: 'POST',
            body: JSON.stringify({
                hostname,
                platform,
                os_version: osVersion
            })
        });
        
        showNotification('Host added successfully!', 'success');
        hideAddHostModal();
        loadHosts();
        loadDashboardData();
    } catch (error) {
        console.error('❌ Error adding host:', error);
        showNotification('Error adding host', 'error');
    }
}

// Event management functions
async function loadEvents() {
    try {
        console.log('🚨 Loading events...');
        const events = await fetchAPI('/api/events');
        updateEventsTable(events);
    } catch (error) {
        console.error('❌ Error loading events:', error);
        showNotification('Error loading events', 'error');
    }
}

function updateEventsTable(events) {
    const tbody = document.getElementById('eventsTable');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No events found</td></tr>';
            return;
        }
        
        events.forEach(event => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDateTime(event.event_time)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${event.host_id || 'Unknown'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${event.event_type}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="severity-${event.severity} px-2 py-1 rounded-full text-xs text-white">
                        ${event.severity}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${getEventDetails(event)}
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

function getEventDetails(event) {
    if (event.proc_name) return `Process: ${event.proc_name}`;
    if (event.file_path) return `File: ${event.file_path}`;
    if (event.net_raddr) return `Network: ${event.net_raddr}:${event.net_rport}`;
    return 'No details';
}

function applyEventFilters() {
    const eventType = document.getElementById('eventTypeFilter').value;
    const severity = document.getElementById('severityFilter').value;
    const hostId = document.getElementById('hostFilter').value;
    
    let url = '/api/events?';
    if (eventType) url += `event_type=${eventType}&`;
    if (severity) url += `severity=${severity}&`;
    if (hostId) url += `host_id=${hostId}&`;
    
    fetchAPI(url).then(events => {
        updateEventsTable(events);
    }).catch(error => {
        console.error('❌ Error applying filters:', error);
        showNotification('Error applying filters', 'error');
    });
}

// Rule management functions
async function loadRules() {
    try {
        console.log('📜 Loading rules...');
        const rules = await fetchAPI('/api/rules');
        updateRulesTable(rules);
    } catch (error) {
        console.error('❌ Error loading rules:', error);
        showNotification('Error loading rules', 'error');
    }
}

function updateRulesTable(rules) {
    const tbody = document.getElementById('rulesTable');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (rules.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No rules found</td></tr>';
            return;
        }
        
        rules.forEach(rule => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${rule.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ${rule.definition.type || 'Unknown'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${rule.definition.pattern || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="toggleRule(${rule.id}, ${!rule.enabled})" class="text-blue-600 hover:text-blue-900 mr-3">
                        ${rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button onclick="deleteRule(${rule.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

async function addRule() {
    const name = document.getElementById('ruleName').value;
    const type = document.getElementById('ruleType').value;
    const pattern = document.getElementById('rulePattern').value;
    
    try {
        const rule = await fetchAPI('/api/rules', {
            method: 'POST',
            body: JSON.stringify({
                name,
                definition: {
                    type,
                    pattern
                }
            })
        });
        
        showNotification('Rule added successfully!', 'success');
        hideAddRuleModal();
        loadRules();
        loadDashboardData();
    } catch (error) {
        console.error('❌ Error adding rule:', error);
        showNotification('Error adding rule', 'error');
    }
}

// Alert management functions
async function loadAlerts() {
    try {
        console.log('🔔 Loading alerts...');
        const alerts = await fetchAPI('/api/alerts');
        updateAlertsTable(alerts);
    } catch (error) {
        console.error('❌ Error loading alerts:', error);
        showNotification('Error loading alerts', 'error');
    }
}

function updateAlertsTable(alerts) {
    const tbody = document.getElementById('alertsTable');
    if (tbody) {
        tbody.innerHTML = '';
        
        if (alerts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No alerts found</td></tr>';
            return;
        }
        
        alerts.forEach(alert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDateTime(alert.first_seen)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${alert.title}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="severity-${alert.severity} px-2 py-1 rounded-full text-xs text-white">
                        ${alert.severity}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-${alert.status} px-2 py-1 rounded-full text-xs text-white">
                        ${alert.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="updateAlertStatus(${alert.id}, 'in_progress')" class="text-blue-600 hover:text-blue-900 mr-3">In Progress</button>
                    <button onclick="updateAlertStatus(${alert.id}, 'resolved')" class="text-green-600 hover:text-green-900 mr-3">Resolve</button>
                    <button onclick="updateAlertStatus(${alert.id}, 'false_positive')" class="text-gray-600 hover:text-gray-900">False Positive</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}

function applyAlertFilters() {
    const severity = document.getElementById('alertSeverityFilter').value;
    const status = document.getElementById('alertStatusFilter').value;
    
    let url = '/api/alerts?';
    if (severity) url += `severity=${severity}&`;
    if (status) url += `status=${status}&`;
    
    fetchAPI(url).then(alerts => {
        updateAlertsTable(alerts);
    }).catch(error => {
        console.error('❌ Error applying filters:', error);
        showNotification('Error applying filters', 'error');
    });
}

// Modal functions
function showAddHostModal() {
    document.getElementById('addHostModal').classList.remove('hidden');
    document.getElementById('addHostForm').reset();
}

function hideAddHostModal() {
    document.getElementById('addHostModal').classList.add('hidden');
}

function showAddRuleModal() {
    document.getElementById('addRuleModal').classList.remove('hidden');
    document.getElementById('addRuleForm').reset();
}

function hideAddRuleModal() {
    document.getElementById('addRuleModal').classList.add('hidden');
}

// Utility functions
async function fetchAPI(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(endpoint, finalOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`❌ API Error (${endpoint}):`, error);
        throw error;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Additional functions for future implementation
function editHost(hostId) {
    showNotification('Edit host functionality coming soon!', 'info');
}

function deleteHost(hostId) {
    if (confirm('Are you sure you want to delete this host?')) {
        fetchAPI(`/api/hosts/${hostId}`, { method: 'DELETE' })
            .then(() => {
                showNotification('Host deleted successfully!', 'success');
                loadHosts();
                loadDashboardData();
            })
            .catch(error => {
                console.error('❌ Error deleting host:', error);
                showNotification('Error deleting host', 'error');
            });
    }
}

function toggleRule(ruleId, enabled) {
    fetchAPI(`/api/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled })
    })
    .then(() => {
        showNotification(`Rule ${enabled ? 'enabled' : 'disabled'} successfully!`, 'success');
        loadRules();
    })
    .catch(error => {
        console.error('❌ Error toggling rule:', error);
        showNotification('Error toggling rule', 'error');
    });
}

function deleteRule(ruleId) {
    if (confirm('Are you sure you want to delete this rule?')) {
        fetchAPI(`/api/rules/${ruleId}`, { method: 'DELETE' })
            .then(() => {
                showNotification('Rule deleted successfully!', 'success');
                loadRules();
                loadDashboardData();
            })
            .catch(error => {
                console.error('❌ Error deleting rule:', error);
                showNotification('Error deleting rule', 'error');
            });
    }
}

function updateAlertStatus(alertId, status) {
    fetchAPI(`/api/alerts/${alertId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    })
    .then(() => {
        showNotification('Alert status updated successfully!', 'success');
        loadAlerts();
        loadDashboardData();
    })
    .catch(error => {
        console.error('❌ Error updating alert status:', error);
        showNotification('Error updating alert status', 'error');
    });
}
