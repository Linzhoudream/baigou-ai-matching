/* ===== 白沟AI匹配台 · UI交互层 ===== */

(function () {
  'use strict';

  const R = window.BaigouRules;
  const posts = [...R.SAMPLES]; // 运行时帖子列表

  // ===== 状态管理 =====
  const state = {
    filters: { role: '', category: '', quantity: '', delivery: '' },
    wizard: {
      step: 1,
      role: '',
      category: '',
      quantity: '',
      delivery: '',
      price: '',
      note: '',
    },
    aiContext: {
      intent: '',
      role: '',
      category: '',
    },
  };

  // ===== DOM 缓存 =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    feedList: $('#feedList'),
    feedCount: $('#feedCount'),
    feedEmpty: $('#feedEmpty'),
    aiChat: $('#aiChat'),
    aiInput: $('#aiInput'),
    aiQuickActions: $('#aiQuickActions'),
    publishModal: $('#publishModal'),
    matchModal: $('#matchModal'),
    matchBody: $('#matchBody'),
    adCarousel: $('#adCarousel'),
    toastContainer: $('#toastContainer'),
    // Filters
    filterRole: $('#filterRole'),
    filterCategory: $('#filterCategory'),
    filterQuantity: $('#filterQuantity'),
    filterDelivery: $('#filterDelivery'),
    // Wizard
    wizStep1: document.querySelector('[data-step="1"]'),
    wizStep2: document.querySelector('[data-step="2"]'),
    wizStep3: document.querySelector('[data-step="3"]'),
    wizStep4: document.querySelector('[data-step="4"]'),
    wizPreview: $('#wizPreview'),
    wizTranslate: $('#wizTranslate'),
    wizSteps: $('#wizSteps'),
    btnWizNext: $('#btnWizNext'),
    btnWizPrev: $('#btnWizPrev'),
    btnWizPublish: $('#btnWizPublish'),
    btnCloseModal: $('#btnCloseModal'),
    btnCloseMatch: $('#btnCloseMatch'),
    btnCloseMatch2: $('#btnCloseMatch2'),
  };

  // ===== 初始化 =====
  function init() {
    renderFeed();
    bindEvents();
    startAdCarousel();
  }

  // ===== 渲染信息流 =====
  function renderFeed(filteredPosts) {
    const data = filteredPosts || filterPosts();
    dom.feedCount.textContent = `共 ${data.length} 条`;

    if (data.length === 0) {
      dom.feedList.innerHTML = '';
      dom.feedList.appendChild(dom.feedEmpty);
      dom.feedEmpty.style.display = '';
      return;
    }

    dom.feedEmpty.style.display = 'none';
    dom.feedList.innerHTML = data.map(post => createPostCard(post)).join('');

    // 绑定帖子卡片事件
    dom.feedList.querySelectorAll('.post-card').forEach((card, i) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.post-action-btn')) return;
        showMatchResults(data[i]);
      });
    });

    dom.feedList.querySelectorAll('.post-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const postId = btn.dataset.postId;
        const post = data.find(p => p.id === postId);
        if (!post) return;

        if (action === 'match') {
          showMatchResults(post);
        } else if (action === 'contact') {
          showToast('已复制联系方式（演示模式）', 'info');
        }
      });
    });
  }

  function createPostCard(post) {
    const roleType = R.getRoleType(post.role);
    const roleIcon = R.CONFIG.ROLES[Object.keys(R.CONFIG.ROLES).find(k => R.CONFIG.ROLES[k].id === post.role)]?.icon || '📋';
    const time = R.formatTime(post.timestamp);
    const translateCards = R.translate(post);

    const metaItems = [];
    if (post.category) metaItems.push(`<span class="post-meta-item">📦 <strong>${post.category}</strong></span>`);
    if (post.quantity) metaItems.push(`<span class="post-meta-item">📊 <strong>${post.quantity}</strong></span>`);
    if (post.delivery) metaItems.push(`<span class="post-meta-item">⏱ <strong>${post.delivery}</strong></span>`);
    if (post.price) metaItems.push(`<span class="post-meta-item">💰 <strong>${post.price}</strong></span>`);

    const matchCount = R.runMatch(post, posts).length;

    return `
      <div class="post-card">
        <div class="post-card-header">
          <span class="post-role-tag ${roleType}">${roleIcon} ${post.role}</span>
          <span class="post-time">${time}</span>
        </div>
        <div class="post-card-body">
          <div class="post-title">${escapeHtml(post.title)}</div>
          <div class="post-desc">${escapeHtml(post.raw)}</div>
        </div>
        <div class="post-card-meta">${metaItems.join('')}</div>
        ${translateCards.length > 0 ? createTranslateCard(translateCards) : ''}
        <div class="post-card-footer">
          <span class="post-match-badge" style="cursor:pointer">🔗 匹配到 ${matchCount} 条相关需求</span>
          <div class="post-actions">
            <button class="post-action-btn" data-action="match" data-post-id="${post.id}">查看匹配</button>
            <button class="post-action-btn" data-action="contact" data-post-id="${post.id}">联系对方</button>
          </div>
        </div>
      </div>
    `;
  }

  function createTranslateCard(cards) {
    const items = cards.map(c => `
      <div class="translate-item">
        <span class="translate-label pain">卡点</span>
        <span>${escapeHtml(c.pain)}</span>
      </div>
      <div class="translate-item">
        <span class="translate-label advice">建议</span>
        <span>${escapeHtml(c.advice)}</span>
      </div>
      <div class="translate-item">
        <span class="translate-label risk">风险</span>
        <span>${escapeHtml(c.risk)}</span>
      </div>
    `).join('');

    return `
      <div class="post-translate-card">
        <div class="translate-header">🤖 AI产业顾问分析</div>
        <div class="translate-items">${items}</div>
      </div>
    `;
  }

  // ===== 筛选 =====
  function filterPosts() {
    return R.filterPosts(posts, state.filters);
  }

  function applyFilters() {
    state.filters.role = dom.filterRole.value;
    state.filters.category = dom.filterCategory.value;
    state.filters.quantity = dom.filterQuantity.value;
    state.filters.delivery = dom.filterDelivery.value;
    renderFeed();
  }

  function clearFilters() {
    state.filters = { role: '', category: '', quantity: '', delivery: '' };
    dom.filterRole.value = '';
    dom.filterCategory.value = '';
    dom.filterQuantity.value = '';
    dom.filterDelivery.value = '';
    renderFeed();
  }

  // ===== 匹配结果弹窗 =====
  function showMatchResults(post) {
    const matches = R.runMatch(post, posts);

    if (matches.length === 0) {
      dom.matchBody.innerHTML = `
        <div class="feed-empty">
          <div class="empty-icon">🔍</div>
          <p class="empty-title">暂未找到匹配需求</p>
          <p class="empty-desc">当前没有发布与您互补的供需信息，试试发布更多信息吸引匹配</p>
        </div>
      `;
    } else {
      dom.matchBody.innerHTML = `
        <div style="margin-bottom: var(--space-lg); padding: var(--space-lg); background: var(--brand-light); border-radius: var(--radius);">
          <div style="font-size: 14px; font-weight: 600; color: var(--brand); margin-bottom: var(--space-xs);">📌 当前帖子</div>
          <div style="font-size: 14px; color: var(--text);">${escapeHtml(post.title)}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${post.role} · ${post.category || '未指定品类'} · ${post.quantity || '数量未指定'}</div>
        </div>
        ${matches.map((m, i) => `
          <div class="match-result">
            <div class="match-score">
              <span style="font-size: 12px; color: var(--text-muted);">匹配度</span>
              <div class="match-score-bar">
                <div class="match-score-fill" style="width: ${m.matchPercent}%; transition-delay: ${i * 0.1}s;"></div>
              </div>
              <span class="match-score-text">${m.matchPercent}%</span>
            </div>
            <div class="match-detail">
              <div class="match-post">
                <div class="match-post-title">${escapeHtml(post.title)}</div>
                <div class="match-post-meta">${post.role} · ${post.category || '未指定'}</div>
              </div>
              <div class="match-arrow">→</div>
              <div class="match-post">
                <div class="match-post-title">${escapeHtml(m.post.title)}</div>
                <div class="match-post-meta">${m.post.role} · ${m.post.category || '未指定'}</div>
              </div>
            </div>
            <div style="margin-top: var(--space-md); font-size: 12px; color: var(--text-muted);">
              ${m.reasons.map(r => `<span style="display: inline-block; margin-right: 12px; padding: 2px 8px; background: var(--bg); border-radius: var(--radius-full);">${r}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      `;
    }

    dom.matchModal.classList.add('active');
  }

  function closeMatchModal() {
    dom.matchModal.classList.remove('active');
  }

  // ===== 发布向导 =====
  function openPublishWizard() {
    resetWizard();
    dom.publishModal.classList.add('active');
    updateWizardUI();
  }

  function closePublishWizard() {
    dom.publishModal.classList.remove('active');
  }

  function resetWizard() {
    state.wizard = { step: 1, role: '', category: '', quantity: '', delivery: '', price: '', note: '' };
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.querySelector('[data-step="1"]').classList.add('active');
    document.querySelectorAll('.wizard-option').forEach(o => o.classList.remove('selected'));
    dom.wizPreview.innerHTML = '';
    dom.wizTranslate.innerHTML = '';
  }

  function updateWizardUI() {
    const step = state.wizard.step;
    const totalSteps = 4;

    // 步骤指示器
    dom.wizSteps.textContent = `步骤 ${step}/${totalSteps}`;

    // 按钮状态
    dom.btnWizPrev.style.display = step > 1 ? '' : 'none';
    dom.btnWizNext.style.display = step < 4 ? '' : 'none';
    dom.btnWizPublish.style.display = step === 4 ? '' : 'none';

    // 步骤面板
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    const currentStep = document.querySelector(`[data-step="${step}"]`);
    if (currentStep) currentStep.classList.add('active');

    // 步骤4：生成预览
    if (step === 4) {
      generatePreview();
    }
  }

  function wizardNext() {
    const step = state.wizard.step;

    if (step === 1) {
      if (!state.wizard.role) {
        showToast('请先选择你的角色', 'error');
        return;
      }
    }

    if (step === 2) {
      if (!state.wizard.category) {
        showToast('请选择品类', 'error');
        return;
      }
    }

    if (step < 4) {
      state.wizard.step++;
      updateWizardUI();
    }
  }

  function wizardPrev() {
    if (state.wizard.step > 1) {
      state.wizard.step--;
      updateWizardUI();
    }
  }

  function selectWizardRole(role) {
    state.wizard.role = role;
    document.querySelectorAll('.wizard-step[data-step="1"] .wizard-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.role === role);
    });
    // 自动进入下一步
    setTimeout(() => wizardNext(), 300);
  }

  function selectWizardCategory(cat) {
    state.wizard.category = cat;
    document.querySelectorAll('.wizard-step[data-step="2"] .wizard-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.cat === cat);
    });
    setTimeout(() => wizardNext(), 300);
  }

  function generatePreview() {
    // 收集表单数据
    state.wizard.quantity = document.getElementById('wizQuantity')?.value || '';
    state.wizard.delivery = document.getElementById('wizDelivery')?.value || '';
    state.wizard.price = document.getElementById('wizPrice')?.value || '';
    state.wizard.note = document.getElementById('wizNote')?.value || '';

    const roleIcon = Object.values(R.CONFIG.ROLES).find(r => r.id === state.wizard.role)?.icon || '📋';

    dom.wizPreview.innerHTML = `
      <div class="preview-item">
        <span class="preview-label">角色</span>
        <span class="preview-value">${roleIcon} ${state.wizard.role}</span>
      </div>
      <div class="preview-item">
        <span class="preview-label">品类</span>
        <span class="preview-value">${state.wizard.category}</span>
      </div>
      ${state.wizard.quantity ? `<div class="preview-item"><span class="preview-label">数量</span><span class="preview-value">${state.wizard.quantity}</span></div>` : ''}
      ${state.wizard.delivery ? `<div class="preview-item"><span class="preview-label">交期</span><span class="preview-value">${state.wizard.delivery}</span></div>` : ''}
      ${state.wizard.price ? `<div class="preview-item"><span class="preview-label">价格</span><span class="preview-value">${state.wizard.price}</span></div>` : ''}
      ${state.wizard.note ? `<div class="preview-item"><span class="preview-label">备注</span><span class="preview-value">${escapeHtml(state.wizard.note)}</span></div>` : ''}
    `;

    // 生成AI翻译
    const mockPost = {
      role: state.wizard.role,
      category: state.wizard.category,
      quantity: state.wizard.quantity || '未指定',
      delivery: state.wizard.delivery || '未指定',
      price: state.wizard.price || '未指定',
      raw: state.wizard.note || `${state.wizard.role}，做${state.wizard.category}，数量${state.wizard.quantity || '未指定'}`,
    };
    const cards = R.translate(mockPost);
    dom.wizTranslate.innerHTML = cards.length > 0 ? createTranslateCard(cards) : '';
  }

  function publishPost() {
    const title = `${state.wizard.role} - ${state.wizard.category}${state.wizard.quantity ? ' ' + state.wizard.quantity : ''}`;
    const raw = state.wizard.note || `${state.wizard.role}，品类${state.wizard.category}，数量${state.wizard.quantity || '待定'}，交期${state.wizard.delivery || '待定'}，价格${state.wizard.price || '面议'}`;

    const newPost = {
      id: R.generateId(),
      role: state.wizard.role,
      category: state.wizard.category,
      quantity: state.wizard.quantity || '',
      delivery: state.wizard.delivery || '',
      price: state.wizard.price || '面议',
      title: title,
      raw: raw,
      timestamp: Date.now(),
    };

    posts.unshift(newPost);
    closePublishWizard();
    renderFeed();
    showToast('发布成功！AI正在为你匹配中...', 'success');

    // 自动显示匹配结果
    setTimeout(() => showMatchResults(newPost), 800);
  }

  // ===== AI 对话 =====
  function addAiMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message ${isUser ? 'ai-message-user' : 'ai-message-bot'}`;

    if (isUser) {
      msgDiv.innerHTML = `
        <div class="ai-avatar">👤</div>
        <div class="ai-bubble">${escapeHtml(text)}</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-bubble">${text.replace(/\n/g, '<br>')}</div>
      `;
    }

    dom.aiChat.appendChild(msgDiv);
    dom.aiChat.scrollTop = dom.aiChat.scrollHeight;
  }

  function addAiQuickActions(actions) {
    dom.aiQuickActions.innerHTML = actions.map(a => `
      <button class="quick-btn" data-intent="${a.intent || ''}" data-role="${a.role || ''}" data-cat="${a.cat || ''}">${a.label}</button>
    `).join('');

    dom.aiQuickActions.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => handleQuickAction(btn));
    });
  }

  function handleQuickAction(btn) {
    const intent = btn.dataset.intent;
    const role = btn.dataset.role;
    const cat = btn.dataset.cat;

    if (intent === '放加工') {
      addAiMessage('我要放加工订单', true);
      state.aiContext.intent = '放加工';
      state.aiContext.role = '采购商';
      setTimeout(() => {
        addAiMessage('好的，你是采购方，需要找加工厂代工。请问做什么类型的包？');
        addAiQuickActions(R.CONFIG.CATEGORIES.slice(0, 6).map(c => ({
          label: `${c.icon} ${c.label}`,
          cat: c.id,
        })));
      }, 500);
    } else if (intent === '接加工') {
      addAiMessage('我要接加工单', true);
      state.aiContext.intent = '接加工';
      state.aiContext.role = '加工厂';
      setTimeout(() => {
        addAiMessage('明白了，你是加工厂，需要接订单。你们主要做什么类型的包？');
        addAiQuickActions(R.CONFIG.CATEGORIES.slice(0, 6).map(c => ({
          label: `${c.icon} ${c.label}`,
          cat: c.id,
        })));
      }, 500);
    } else if (intent === '找供货商') {
      addAiMessage('我要找供货商', true);
      state.aiContext.intent = '找供货商';
      state.aiContext.role = '采购商';
      setTimeout(() => {
        addAiMessage('好的，你需要找供货商。是找成品包货源，还是找辅料配件？');
        addAiQuickActions([
          { label: '👜 成品包货源', cat: '成品包' },
          { label: '🧵 辅料配件', cat: '辅料配件' },
        ]);
      }, 500);
    } else if (intent === '供货物料') {
      addAiMessage('我要供应物料', true);
      state.aiContext.intent = '供货物料';
      state.aiContext.role = '辅料供应商';
      setTimeout(() => {
        addAiMessage('好的，你是辅料供应商。你们主要供应什么类型的物料？');
        addAiQuickActions([
          { label: '🔩 五金配件', cat: '五金配件' },
          { label: '🧵 拉链', cat: '拉链' },
          { label: '🧶 面料', cat: '面料' },
          { label: '📐 其他辅料', cat: '其他' },
        ]);
      }, 500);
    } else if (cat) {
      addAiMessage(cat, true);
      state.aiContext.category = cat;
      setTimeout(() => {
        addAiMessage(`好的，了解了。补充一下关键信息：数量、交期、价格要求？<br><br>你也可以直接点击下方"免费发布"，AI会帮你生成完整的供需帖。`);
        addAiQuickActions([
          { label: '📝 去发布信息', intent: 'publish' },
          { label: '🔍 先看看匹配', intent: 'match' },
        ]);
      }, 500);
    } else if (intent === 'publish') {
      openPublishWizard();
      // 预填角色和品类
      if (state.aiContext.role) state.wizard.role = state.aiContext.role;
      if (state.aiContext.category) state.wizard.category = state.aiContext.category;
      if (state.aiContext.role) {
        state.wizard.step = 2;
        // highlight the category
        setTimeout(() => {
          if (state.aiContext.category) {
            document.querySelectorAll('.wizard-step[data-step="2"] .wizard-option').forEach(o => {
              if (o.dataset.cat === state.aiContext.category) o.classList.add('selected');
            });
          }
        }, 100);
      }
      updateWizardUI();
    } else if (intent === 'match') {
      // 基于当前上下文搜索匹配
      const filtered = posts.filter(p => p.role !== state.aiContext.role);
      if (filtered.length > 0) {
        showMatchResults(filtered[0]);
      } else {
        addAiMessage('当前还没有匹配的需求信息，试试发布你的需求吧！');
      }
    }
  }

  function handleAiInput() {
    const text = dom.aiInput.value.trim();
    if (!text) return;

    addAiMessage(text, true);
    dom.aiInput.value = '';

    // 解析用户输入
    const parsed = R.parsePost(text);

    setTimeout(() => {
      if (parsed.role) {
        state.aiContext.role = parsed.role;
        state.aiContext.category = parsed.category || '';

        const roleName = R.CONFIG.ROLES[Object.keys(R.CONFIG.ROLES).find(k => R.CONFIG.ROLES[k].id === parsed.role)]?.label || parsed.role;
        addAiMessage(`我识别到你是<b>${roleName}</b>${parsed.category ? '，做<b>' + parsed.category + '</b>' : ''}。`);
        addAiMessage('需要我帮你发布信息，还是直接匹配？');
        addAiQuickActions([
          { label: '📝 发布供需信息', intent: 'publish' },
          { label: '🔍 查看匹配结果', intent: 'match' },
        ]);
      } else {
        addAiMessage('抱歉，我没能识别到你的角色。你可以直接说：<br>• "我是加工厂，做女包"<br>• "我需要找加工厂"<br>• "我供应五金配件"<br><br>或者点击下方按钮快速开始 👇');
        addAiQuickActions([
          { label: '我要放加工订单', intent: '放加工' },
          { label: '我要接加工单', intent: '接加工' },
          { label: '找供货商', intent: '找供货商' },
          { label: '我要供应物料', intent: '供货物料' },
        ]);
      }
    }, 600);
  }

  // ===== 广告轮播 =====
  function startAdCarousel() {
    const slides = dom.adCarousel.querySelectorAll('.ad-slide');
    const dots = document.querySelectorAll('.ad-dot');
    let current = 0;

    setInterval(() => {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }, 4000);

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.ad);
        slides[current].classList.remove('active');
        dots[current].classList.remove('active');
        current = idx;
        slides[current].classList.add('active');
        dots[current].classList.add('active');
      });
    });
  }

  // ===== Toast =====
  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `${icons[type] || ''} ${message}`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ===== 分类按钮 =====
  function handleCategoryClick(btn) {
    const cat = btn.dataset.cat;
    // 去掉同级active
    btn.parentElement.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.filters.category = cat;
    dom.filterCategory.value = cat;
    renderFeed();
  }

  function handleServiceClick(btn) {
    const cat = btn.dataset.cat;
    if (cat === '诈骗举报') {
      showToast('已跳转到诈骗举报页面（演示模式）', 'info');
      return;
    }
    if (cat === '找回密码') {
      showToast('已发送密码重置链接（演示模式）', 'info');
      return;
    }
    // 其他服务按钮
    showToast(`已进入"${cat}"板块（演示模式）`, 'info');
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    // 发布按钮
    $('#btnPublish').addEventListener('click', openPublishWizard);
    document.querySelector('.bottom-nav-publish')?.addEventListener('click', (e) => {
      e.preventDefault();
      openPublishWizard();
    });

    // 关闭弹窗
    dom.btnCloseModal.addEventListener('click', closePublishWizard);
    dom.publishModal.addEventListener('click', (e) => {
      if (e.target === dom.publishModal) closePublishWizard();
    });
    dom.btnCloseMatch.addEventListener('click', closeMatchModal);
    dom.btnCloseMatch2.addEventListener('click', closeMatchModal);
    dom.matchModal.addEventListener('click', (e) => {
      if (e.target === dom.matchModal) closeMatchModal();
    });

    // 向导步骤
    dom.btnWizNext.addEventListener('click', wizardNext);
    dom.btnWizPrev.addEventListener('click', wizardPrev);
    dom.btnWizPublish.addEventListener('click', publishPost);

    // 向导选项点击
    document.querySelectorAll('.wizard-step[data-step="1"] .wizard-option').forEach(btn => {
      btn.addEventListener('click', () => selectWizardRole(btn.dataset.role));
    });
    document.querySelectorAll('.wizard-step[data-step="2"] .wizard-option').forEach(btn => {
      btn.addEventListener('click', () => selectWizardCategory(btn.dataset.cat));
    });

    // 筛选
    dom.filterRole.addEventListener('change', applyFilters);
    dom.filterCategory.addEventListener('change', applyFilters);
    dom.filterQuantity.addEventListener('change', applyFilters);
    dom.filterDelivery.addEventListener('change', applyFilters);
    $('#btnClearFilter').addEventListener('click', clearFilters);

    // 分类按钮
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => handleCategoryClick(btn));
    });

    // 服务按钮
    document.querySelectorAll('.service-btn').forEach(btn => {
      btn.addEventListener('click', () => handleServiceClick(btn));
    });

    // AI 对话
    $('#btnAiSend').addEventListener('click', handleAiInput);
    dom.aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAiInput();
      }
    });

    // 初始快捷操作
    dom.aiQuickActions.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => handleQuickAction(btn));
    });

    // AI Hero 示例点击
    document.querySelectorAll('.ai-hero-example').forEach(el => {
      el.addEventListener('click', () => {
        const text = el.dataset.example;
        if (text) {
          dom.aiInput.value = text;
          dom.aiInput.focus();
          handleAiInput();
        }
      });
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePublishWizard();
        closeMatchModal();
      }
    });

    // 登录按钮
    $('#btnLogin').addEventListener('click', () => {
      showToast('登录功能（演示模式）', 'info');
    });
  }

  // ===== 工具函数 =====
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== 启动 =====
  init();
})();