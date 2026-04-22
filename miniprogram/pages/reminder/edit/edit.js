const app = getApp();

Page({
  data: {
    isEdit: false,
    reminderId: null,
    form: {
      title: '',
      reminderType: 1,
      targetDate: '',
      isLunar: 0,
      advanceDays: 1,
      notifyTime: '09:00',
      repeatType: 1,
      notifyTarget: 3
    },
    typeOptions: [
      { label: '生日', value: 1 },
      { label: '纪念日', value: 2 },
      { label: '自定义', value: 3 }
    ],
    repeatOptions: [
      { label: '不重复', value: 0 },
      { label: '每年', value: 1 },
      { label: '每月', value: 2 },
      { label: '每周', value: 3 }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, reminderId: options.id });
      this.loadDetail();
    } else {
      const today = new Date().toISOString().split('T')[0];
      this.setData({ 'form.targetDate': today });
    }
  },

  async loadDetail() {
    try {
      const res = await app.callCloud('reminder/list');
      const item = res.data.find(r => r.id == this.data.reminderId);
      if (item) {
        this.setData({
          form: {
            title: item.title,
            reminderType: item.reminder_type,
            targetDate: item.target_date,
            isLunar: item.is_lunar,
            advanceDays: item.advance_days,
            notifyTime: item.notify_time,
            repeatType: item.repeat_type,
            notifyTarget: item.notify_target
          }
        });
      }
    } catch (err) {
      console.error('Load detail error:', err);
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ 'form.reminderType': this.data.typeOptions[index].value });
  },

  onDateChange(e) {
    this.setData({ 'form.targetDate': e.detail.value });
  },

  onLunarChange(e) {
    this.setData({ 'form.isLunar': e.detail.value ? 1 : 0 });
  },

  onAdvanceChange(e) {
    this.setData({ 'form.advanceDays': e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ 'form.notifyTime': e.detail.value });
  },

  onRepeatChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ 'form.repeatType': this.data.repeatOptions[index].value });
  },

  setNotifyTarget(e) {
    this.setData({ 'form.notifyTarget': parseInt(e.currentTarget.dataset.value) });
  },

  async submit() {
    if (!this.data.form.title) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!this.data.form.targetDate) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      const data = {
        title: this.data.form.title,
        reminderType: this.data.form.reminderType,
        targetDate: this.data.form.targetDate,
        isLunar: this.data.form.isLunar,
        advanceDays: this.data.form.advanceDays,
        notifyTime: this.data.form.notifyTime + ':00',
        repeatType: this.data.form.repeatType,
        notifyTarget: this.data.form.notifyTarget
      };

      if (this.data.isEdit) {
        await app.callCloud('reminder/update', {
          reminderId: this.data.reminderId,
          data
        });
      } else {
        await app.callCloud('reminder/create', { data });
      }

      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});