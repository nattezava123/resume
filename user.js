let currentUserId = localStorage.getItem('session_user_id');
let currentRate = 0; 

document.addEventListener("DOMContentLoaded", () => {
    if (!currentUserId) { window.location.href = 'login.html'; return; }
    updateHeaderDisplay(); 
    loadUserProfile();
    populateFuelDropdown();
    
    // ตั้งค่าตัวเลือกเดือนเริ่มต้นให้ล็อกเข้าเดือนปัจจุบันโดยอัตโนมัติ
    const now = new Date();
    const currentMonthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const monthInput = document.getElementById('user-report-month');
    if (monthInput) {
        monthInput.value = currentMonthStr;
    }
    
    switchTab('edit'); 
});

function updateHeaderDisplay() {
    const users = JSON.parse(localStorage.getItem('users'));
    const u = users.find(user => user.user_id === currentUserId);
    if(u) {
        document.getElementById('header-user-name').innerText = `${u.firstname} ${u.lastname}`;
        document.getElementById('header-avatar').src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
    }
}

function switchTab(targetTab) {
    document.querySelectorAll('.tab-view').forEach(view => view.style.display = 'none');
    document.querySelectorAll('.sidebar .menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`tab-${targetTab}-view`).style.display = 'block';
    document.getElementById(`menu-${targetTab}`).classList.add('active');
    
    if (targetTab === 'report') renderUserReports();
}

function loadUserProfile() {
    const users = JSON.parse(localStorage.getItem('users'));
    const u = users.find(user => user.user_id === currentUserId);
    if(u) {
        document.getElementById('edit-prefix').value = u.prefix || "นาย";
        document.getElementById('edit-firstname').value = u.firstname;
        document.getElementById('edit-lastname').value = u.lastname;
        document.getElementById('edit-userid').value = u.user_id;
        document.getElementById('edit-password').value = u.password;
        document.getElementById('edit-phone').value = u.phone_number;
        document.getElementById('profile-avatar-display').src = u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
    }
}

function updateProfileData() {
    let users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(user => user.user_id === currentUserId);
    if(idx !== -1) {
        const executeUpdate = (base64Img) => {
            users[idx].prefix = document.getElementById('edit-prefix').value;
            users[idx].firstname = document.getElementById('edit-firstname').value.trim();
            users[idx].lastname = document.getElementById('edit-lastname').value.trim();
            users[idx].password = document.getElementById('edit-password').value;
            users[idx].phone_number = document.getElementById('edit-phone').value.trim();
            if(base64Img) users[idx].avatar = base64Img; 

            localStorage.setItem('users', JSON.stringify(users));
            document.getElementById('profile-avatar-display').src = users[idx].avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
            document.getElementById('edit-avatar').value = ''; 
            updateHeaderDisplay(); 
            Swal.fire({ icon: 'success', title: 'อัปเดตสำเร็จ', text: 'ข้อมูลส่วนตัวของคุณถูกบันทึกแล้ว', confirmButtonColor: '#2563eb' });
        };
        const fileInput = document.getElementById('edit-avatar');
        if (fileInput.files.length > 0) { const reader = new FileReader(); reader.onload = function(e) { executeUpdate(e.target.result); }; reader.readAsDataURL(fileInput.files[0]); } else { executeUpdate(null); }
    }
}

function populateFuelDropdown() {
    const fuels = JSON.parse(localStorage.getItem('fuels')) || []; const dropdown = document.getElementById('w-fuel-type');
    dropdown.innerHTML = '<option value="">-- เลือกประเภทรถ/น้ำมัน --</option>';
    fuels.forEach(f => { dropdown.innerHTML += `<option value="${f.name}" data-rate="${f.rate}">[${f.type}] ${f.name} (฿${f.rate}/กม.)</option>`; });
}

function calculateLiveExpense() {
    const start = parseFloat(document.getElementById('w-start-mile').value) || 0, end = parseFloat(document.getElementById('w-end-mile').value) || 0;
    const dropdown = document.getElementById('w-fuel-type');
    if(dropdown.selectedIndex > 0) { currentRate = parseFloat(dropdown.options[dropdown.selectedIndex].getAttribute('data-rate')); } else { currentRate = 0; }
    let distance = end - start; if (distance < 0) distance = 0;
    document.getElementById('live-distance').innerText = distance; document.getElementById('live-expense').innerText = (distance * currentRate).toFixed(2);
}

function saveWorkReport() {
    const editId = document.getElementById('edit-report-id').value, wDate = document.getElementById('w-date').value, fuelType = document.getElementById('w-fuel-type').value, start = parseFloat(document.getElementById('w-start-mile').value), end = parseFloat(document.getElementById('w-end-mile').value), detail = document.getElementById('w-detail').value.trim(), fileInput = document.getElementById('w-file');
    if(!wDate || !fuelType || isNaN(start) || isNaN(end) || !detail) { Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกข้อมูลให้ครบถ้วนก่อนบันทึก' }); return; }
    if (end <= start) { Swal.fire({ icon: 'error', title: 'ไมล์รถไม่ถูกต้อง', text: 'เลขไมล์สิ้นสุดต้องมากกว่าเสมอ' }); return; }

    const distance = end - start, expense = distance * currentRate;
    const executeSaving = (base64Img) => {
        let reports = JSON.parse(localStorage.getItem('reports')) || [];
        if (editId) {
            const idx = reports.findIndex(r => r.report_id === editId);
            reports[idx].work_date = wDate; reports[idx].fuel_type = fuelType; reports[idx].start_mile = start; reports[idx].end_mile = end;
            reports[idx].distance_km = distance; reports[idx].reimbursable_expense = expense.toFixed(2); reports[idx].work_detail = detail; reports[idx].rate_used = currentRate; if (base64Img) reports[idx].image_file = base64Img;
        } else {
            reports.push({ report_id: "REP" + Date.now(), user_id: currentUserId, work_date: wDate, fuel_type: fuelType, distance_km: distance, start_mile: start, end_mile: end, work_detail: detail, rate_used: currentRate, image_file: base64Img, approve_disbursement: "P", reimbursable_expense: expense.toFixed(2) });
        }
        localStorage.setItem('reports', JSON.stringify(reports));
        Swal.fire({ icon: 'success', title: editId ? 'แก้ไขสำเร็จ' : 'ส่งคำขอเบิกเรียบร้อย', confirmButtonColor: '#2563eb' }).then(() => {
            document.getElementById('edit-report-id').value = ''; document.getElementById('w-start-mile').value = ''; document.getElementById('w-end-mile').value = ''; document.getElementById('w-detail').value = '';
            calculateLiveExpense(); switchTab('report');
        });
    };
    if (fileInput.files.length > 0) { const reader = new FileReader(); reader.onload = function(e) { executeSaving(e.target.result); }; reader.readAsDataURL(fileInput.files[0]); } else { executeSaving(""); }
}

// ---------------------------------------------------------
// ฟังก์ชันแสดงประวัติพนักงานและออกรายงานสลิป
// ---------------------------------------------------------
function renderUserReports() {
    const reports = JSON.parse(localStorage.getItem('reports')) || []; 
    const tbody = document.getElementById('user-report-list'); 
    tbody.innerHTML = '';
    
    let allTimeBaht = 0;
    let allTimeKm = 0;
    let filteredCount = 0;
    let filteredKm = 0; 
    let filteredBaht = 0;
    
    const selectedMonth = document.getElementById('user-report-month').value; 
    const myReports = reports.filter(r => r.user_id === currentUserId).reverse();
    
    // คำนวณยอดรวมสะสมตลอดชีพ (ไม่สนตัวกรอง)
    myReports.forEach(r => {
        if(r.approve_disbursement === 'Y' || r.approve_disbursement === 'P') { 
            allTimeBaht += parseFloat(r.reimbursable_expense) || 0; 
            allTimeKm += parseFloat(r.distance_km) || 0; 
        }
    });

    // กรองตารางตามเดือนที่เลือก (เพื่อให้ตารางแสดงแค่เดือนนั้นเวลาสั่งพิมพ์)
    let displayReports = myReports;
    if (selectedMonth) {
        displayReports = displayReports.filter(r => r.work_date.startsWith(selectedMonth));
    }

    if (displayReports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">📥 ไม่พบข้อมูลรายงานในเดือนนี้</td></tr>';
    } else {
        displayReports.forEach((r, idx) => {
            if(r.approve_disbursement === 'Y' || r.approve_disbursement === 'P') {
                filteredKm += parseFloat(r.distance_km) || 0;
                filteredBaht += parseFloat(r.reimbursable_expense) || 0;
                filteredCount++;
            }

            let statusText = r.approve_disbursement === 'P' ? 'รอตรวจสอบ' : (r.approve_disbursement === 'Y' ? 'อนุมัติ' : 'ไม่อนุมัติ');
            let rejectReason = r.approve_disbursement === 'N' && r.reason ? `<div class="text-danger mt-1" style="font-size:12px;">เหตุผล: ${r.reason}</div>` : '';
            
            // เพิ่มคลาส no-print เพื่อซ่อนปุ่มจัดการตอนสั่งพิมพ์
            let actionBtns = r.approve_disbursement === 'P' ? `<div class="no-print"><button class="btn-pill btn-edit py-1 px-2" style="font-size:12px;" onclick="editReport('${r.report_id}')">✏️ แก้ไข</button> <button class="btn-pill btn-red py-1 px-2 mt-1" style="font-size:12px;" onclick="deleteReport('${r.report_id}')">🗑️ ลบ</button></div>` : '<span class="no-print">-</span>';
            
            tbody.innerHTML += `<tr><td>${idx + 1}</td><td>${r.work_date}</td><td>${r.work_detail}</td><td>${r.fuel_type}</td><td class="text-muted" style="font-size:12px;">${r.distance_km} กม. x ${r.rate_used||0} ฿</td><td class="fw-bold text-success">฿${r.reimbursable_expense}</td><td><span class="status-tag status-${r.approve_disbursement}">${statusText}</span>${rejectReason}</td><td class="no-print">${actionBtns}</td></tr>`;
        });
    }
    
    // อัปเดตการ์ดสรุปด้านบน
    document.getElementById('sum-total').innerText = allTimeBaht.toFixed(2); 
    document.getElementById('sum-km').innerText = allTimeKm.toFixed(2);
    document.getElementById('sum-month-km').innerText = filteredKm.toFixed(2);

    // อัปเดตกล่องสลิปบิลด้านล่างรายงาน
    document.getElementById('user-bill-count').innerText = `${filteredCount} รายการ`;
    document.getElementById('user-bill-km').innerText = `${filteredKm.toFixed(2)} กม.`;
    document.getElementById('user-bill-total').innerText = `฿${filteredBaht.toFixed(2)}`;
}

function deleteReport(id) {
    Swal.fire({ title: 'ยืนยันการลบรายการ', text: "คุณต้องการยกเลิกและลบรายการเบิกจ่ายนี้ใช่หรือไม่?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ลบทิ้ง!', cancelButtonText: 'ยกเลิก' }).then((result) => {
        if (result.isConfirmed) { let reports = JSON.parse(localStorage.getItem('reports')); reports = reports.filter(r => r.report_id !== id); localStorage.setItem('reports', JSON.stringify(reports)); renderUserReports(); Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', showConfirmButton: false, timer: 1500 }); }
    });
}

function editReport(id) {
    const reports = JSON.parse(localStorage.getItem('reports')); const r = reports.find(x => x.report_id === id);
    if(r) {
        document.getElementById('edit-report-id').value = r.report_id; document.getElementById('w-date').value = r.work_date; document.getElementById('w-fuel-type').value = r.fuel_type;
        document.getElementById('w-start-mile').value = r.start_mile; document.getElementById('w-end-mile').value = r.end_mile; document.getElementById('w-detail').value = r.work_detail;
        switchTab('work'); calculateLiveExpense(); Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'ดึงข้อมูลมาแก้ไขแล้ว', showConfirmButton: false, timer: 4000 });
    }
}

function exitSystem() { Swal.fire({ title: 'ออกจากระบบ', icon: 'question', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ออกจากระบบ' }).then((result) => { if(result.isConfirmed) { localStorage.removeItem('session_user_id'); window.location.href = 'login.html'; } }); }