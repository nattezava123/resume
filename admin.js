let adminSessionId = localStorage.getItem('session_user_id');

document.addEventListener("DOMContentLoaded", () => {
    if (!adminSessionId) { window.location.href = 'login.html'; return; }
    document.getElementById('admin-id-badge').innerText = adminSessionId;
    switchAdminTab('approves'); 
});

function switchAdminTab(tabName) {
    document.querySelectorAll('.adm-tab-view').forEach(view => view.style.display = 'none');
    document.querySelectorAll('.sub-menu-icon').forEach(icon => icon.classList.remove('active'));
    document.getElementById(`adm-${tabName}-view`).style.display = 'block';
    document.getElementById(`sub-btn-${tabName}`).classList.add('active');
    
    if(tabName === 'users') renderEmployeeList();
    if(tabName === 'prices') loadFuelSettings();
    if(tabName === 'approves') renderApprovalQueue();
}

function renderEmployeeList() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const tbody = document.getElementById('admin-user-tbody');
    tbody.innerHTML = '';
    users.forEach((u, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${u.user_id}</strong></td>
                <td>${u.prefix || ''}${u.firstname} ${u.lastname}</td>
                <td>${u.job_position}</td>
                <td>${u.phone_number}</td>
            </tr>`;
    });
}

function loadFuelSettings() {
    const fuels = JSON.parse(localStorage.getItem('fuels')) || [];
    const tbody = document.getElementById('fuel-price-tbody');
    tbody.innerHTML = '';
    fuels.forEach(f => {
        tbody.innerHTML += `
            <tr>
                <td><span class="status-tag" style="background:#64748b;">${f.type}</span></td>
                <td>${f.name}</td>
                <td>
                    <input type="number" step="0.01" class="form-control fuel-rate-input text-center" data-id="${f.id}" value="${f.rate}" style="max-width:150px;">
                </td>
            </tr>`;
    });
}

function updateFuelPrices() {
    let fuels = JSON.parse(localStorage.getItem('fuels'));
    document.querySelectorAll('.fuel-rate-input').forEach(input => {
        let id = parseInt(input.getAttribute('data-id'));
        let match = fuels.find(f => f.id === id);
        if(match) match.rate = parseFloat(input.value) || 0;
    });
    localStorage.setItem('fuels', JSON.stringify(fuels));
    
    Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: 'อัปเดตเรทราคาต่อกิโลเมตรสำเร็จ',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#1A3673'
    });
}

function renderApprovalQueue() {
    const reports = JSON.parse(localStorage.getItem('reports')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const container = document.getElementById('admin-verification-queue');
    container.innerHTML = '';
    
    const sortedReports = reports.slice().reverse().sort((a,b) => (a.approve_disbursement === 'P' ? -1 : 1));

    if (sortedReports.length === 0) {
        container.innerHTML = '<div class="text-center mt-4">ไม่มีรายการขอเบิกจ่าย</div>'; return;
    }
    
    sortedReports.forEach(r => {
        let u = users.find(x => x.user_id === r.user_id) || {};
        let fullName = `${u.prefix||''}${u.firstname||''} ${u.lastname||''}`;
        
        let actionButtons = '';
        if(r.approve_disbursement === 'P') {
            actionButtons = `
                <div class="mt-3">
                    <button class="btn-pill btn-green me-2" onclick="processApproval('${r.report_id}', 'Y')">✔️ อนุมัติ</button>
                    <button class="btn-pill btn-red" onclick="processApproval('${r.report_id}', 'N')">❌ ไม่อนุมัติ</button>
                </div>`;
        } else {
            let statusLabel = r.approve_disbursement === 'Y' ? 'อนุมัติแล้ว' : 'ปฏิเสธคำขอ';
            let reasonText = r.reason ? `<div class="text-danger mt-2" style="font-size:13px;">เหตุผล: ${r.reason}</div>` : '';
            actionButtons = `<div class="mt-3 fw-bold">สถานะ: <span class="status-tag status-${r.approve_disbursement}">${statusLabel}</span> ${reasonText}</div>`;
        }
        
        container.innerHTML += `
            <div class="white-card d-flex justify-content-between align-items-start gap-3">
                <div class="flex-grow-1">
                    <div class="fw-bold fs-6 mb-2" style="color:#1A3673;">ผู้เบิก: ${fullName} (รหัส: ${r.user_id})</div>
                    <div><strong>วันที่:</strong> ${r.work_date} | <strong>งาน:</strong> ${r.work_detail}</div>
                    <div><strong>ประเภท:</strong> ${r.fuel_type} | <strong>ระยะทาง:</strong> ${r.distance_km} กม.</div>
                    <div class="fw-bold mt-2 text-success">ยอดเงินเบิก: ฿${r.reimbursable_expense}</div>
                    ${actionButtons}
                </div>
                ${r.image_file ? `<img src="${r.image_file}" style="width:120px; height:120px; object-fit:cover; border-radius:8px; border:1px solid #ccc;">` : ''}
            </div>`;
    });
}

function processApproval(reportId, newStatus) {
    let reports = JSON.parse(localStorage.getItem('reports'));
    const idx = reports.findIndex(r => r.report_id === reportId);
    
    if(idx !== -1) {
        if(newStatus === 'N') {
            // ใช้ SweetAlert2 แทน Prompt ปกติ
            Swal.fire({
                title: 'ปฏิเสธการเบิกจ่าย',
                text: "กรุณาระบุเหตุผลที่ไม่อนุมัติ (พนักงานจะเห็นข้อความนี้)",
                input: 'text',
                inputPlaceholder: 'พิมพ์เหตุผลที่นี่...',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'ยืนยันการปฏิเสธ',
                cancelButtonText: 'ยกเลิก'
            }).then((result) => {
                if (result.isConfirmed) {
                    reports[idx].reason = result.value || 'ไม่ได้ระบุเหตุผล';
                    reports[idx].approve_disbursement = newStatus;
                    localStorage.setItem('reports', JSON.stringify(reports));
                    renderApprovalQueue();
                    
                    Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', showConfirmButton: false, timer: 1500 });
                }
            });
        } else {
            // กรณีอนุมัติ (Y) ให้ยืนยันได้เลย
            Swal.fire({
                title: 'ยืนยันการอนุมัติ?',
                text: "ยอดเงินจะถูกบันทึกเป็นอนุมัติจ่ายให้พนักงาน",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'ยืนยันอนุมัติ',
                cancelButtonText: 'ยกเลิก'
            }).then((result) => {
                if(result.isConfirmed) {
                    reports[idx].approve_disbursement = newStatus;
                    localStorage.setItem('reports', JSON.stringify(reports));
                    renderApprovalQueue();
                    
                    Swal.fire({ icon: 'success', title: 'อนุมัติเรียบร้อย', showConfirmButton: false, timer: 1500 });
                }
            });
        }
    }
}

function exitSystem() { 
    Swal.fire({
        title: 'ออกจากระบบ',
        text: 'ต้องการออกจากระบบใช่หรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ใช่, ออกจากระบบ'
    }).then((result) => {
        if(result.isConfirmed) {
            localStorage.removeItem('session_user_id'); 
            window.location.href = 'login.html'; 
        }
    });
}