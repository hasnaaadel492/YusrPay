// التأكد من تهيئة عميل Supabase بلطف
const SUPABASE_URL = 'https://kdmlkhlceihidcmwdhxi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G5uoFE-wczB6h1YeBAt__g_0ktNTptG';

const supabase = window.supabaseClientInstance || window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function initDashboard() {
    // 1. الفحص: هل المستخدم مسجل دخول؟
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = '/login.html';
        return;
    }

    const user = session.user;
    // عرض رقم الجوال أو البريد الوهمي بشكل نظيف في الهيدر
    const displayPhone = user.email ? user.email.replace('user_', '').replace('@mohla24.com', '') : 'مستخدم المنصة';
    const emailEl = document.getElementById('user-email');
    if(emailEl) emailEl.innerText = `جوال: ${displayPhone}`;

    // 2. جلب حالة الطلب من جدول loan_requests
    const { data: requests, error: reqError } = await supabase
        .from('loan_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

    if (requests && requests.length > 0) {
        const latestRequest = requests[0];
        document.getElementById('order-id').innerText = `#${latestRequest.id}`;
        document.getElementById('order-amount').innerText = `${latestRequest.tier_amount || 0} ريال`;
        
        // عرض مبلغ التمويل مع الأرباح (الإجمالي)
        const totalCostEl = document.getElementById('order-total-cost');
        if (totalCostEl) {
            totalCostEl.innerText = `${latestRequest.total_cost || 0} ريال`;
        }

        // جلب مبلغ التسوية المبكرة من جدول user_loans بناءً على قيمة الشريحة
        if (latestRequest.tier_amount) {
            const { data: tierData } = await supabase
                .from('user_loans')
                .select('early_settlement_first')
                .eq('tier_amount', latestRequest.tier_amount)
                .maybeSingle();

            const earlyEl = document.getElementById('order-early-settlement');
            if (earlyEl) {
                if (tierData && tierData.early_settlement_first) {
                    earlyEl.innerText = `${tierData.early_settlement_first} ريال`;
                } else {
                    // حساب الاحتياطي (مبلغ الشريحة + 30% أرباح)
                    const fallbackEarly = Math.round((latestRequest.tier_amount || 0) * 1.3);
                    earlyEl.innerText = `${fallbackEarly} ريال`;
                }
            }
        }
        
        // تحديث حالة الطلب
        const badge = document.getElementById('order-badge');
        if (latestRequest.status === 'approved') {
            badge.className = "px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 border border-emerald-300";
            badge.innerText = "مقبول ومفعل ✅";
        } else if (latestRequest.status === 'rejected') {
            badge.className = "px-4 py-2 rounded-full text-sm font-bold bg-rose-100 text-rose-800 border border-rose-300";
            badge.innerText = "مرفوض ❌";
        } else {
            badge.className = "px-4 py-2 rounded-full text-sm font-bold bg-amber-100 text-amber-800 border border-amber-300";
            badge.innerText = "قيد المراجعة ⏳";
        }

        // 3. جلب الأقساط الخاصة بالطلب من جدول installments
        fetchInstallments(latestRequest.id);
    } else {
        document.getElementById('order-status-container').innerHTML = `
            <p class="text-slate-500 font-semibold text-xs">لا يوجد لديك طلبات تمويل حالية.</p>
        `;
        document.getElementById('installments-list').innerHTML = `
            <tr><td colspan="4" class="text-center p-6 text-slate-400">لا توجد أقساط مسجلة.</td></tr>
        `;
    }

    // 4. تفعيل زر الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabase.auth.signOut();
            window.location.href = '/login.html';
        };
    }
}

// دالة جلب الأقساط ورسمها في الجدول
async function fetchInstallments(requestId) {
    const { data: installments, error } = await supabase
        .from('installments')
        .select('*')
        .eq('request_id', requestId)
        .order('installment_number', { ascending: true });

    const tbody = document.getElementById('installments-list');

    if (!installments || installments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center p-6 text-slate-400 text-xs">سوف تظهر الأقساط فور اعتماد الطلب من الإدارة.</td></tr>`;
        return;
    }

    tbody.innerHTML = installments.map(item => `
        <tr class="hover:bg-slate-50 transition">
            <td class="p-3.5 font-bold text-slate-800">الشهر ${item.installment_number}</td>
            <td class="p-3.5 font-semibold text-teal-700">${item.amount} ريال</td>
            <td class="p-3.5 text-slate-600">${item.due_date}</td>
            <td class="p-3.5">
                <span class="px-2.5 py-1 text-xs font-bold rounded-full ${
                    item.status === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }">
                    ${item.status === 'paid' ? 'مدفوع' : 'قادم'}
                </span>
            </td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initDashboard);