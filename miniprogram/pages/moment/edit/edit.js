const app = getApp();

Page({
  data: {
    content: '',
    images: [],
    location: '',
    latitude: null,
    longitude: null,
    mood: '',
    moods: ['开心', '难过', '甜蜜', '生气', '疲惫'],
    isShared: 1,
    submitting: false,
    ossConfig: null
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  chooseImage() {
    const remain = 9 - this.data.images.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath);
        this.setData({ images: this.data.images.concat(tempFiles) });
      }
    });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.slice();
    images.splice(index, 1);
    this.setData({ images });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: res.name || res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      }
    });
  },

  selectMood(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({ mood: this.data.mood === mood ? '' : mood });
  },

  setPrivacy(e) {
    this.setData({ isShared: parseInt(e.currentTarget.dataset.value) });
  },

  async getOssToken() {
    const res = await app.callCloud('moment/getOssToken');
    return res.data;
  },

  async uploadImages() {
    const localImages = this.data.images.filter(img => img.startsWith('wxfile://') || img.startsWith('http://tmp'));
    if (localImages.length === 0) return this.data.images;

    const ossConfig = await this.getOssToken();
    const uploadedUrls = [];

    for (const img of localImages) {
      const ext = img.split('.').pop() || 'jpg';
      const key = `moments/${app.globalData.userInfo.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      await wx.uploadFile({
        url: `https://${ossConfig.bucket}.${ossConfig.endpoint}`,
        filePath: img,
        name: 'file',
        formData: {
          key,
          policy: '',
          OSSAccessKeyId: ossConfig.accessKeyId,
          signature: '',
          'x-oss-security-token': ossConfig.securityToken
        }
      });

      uploadedUrls.push(`https://${ossConfig.bucket}.${ossConfig.endpoint}/${key}`);
    }

    const existing = this.data.images.filter(img => !(img.startsWith('wxfile://') || img.startsWith('http://tmp')));
    return existing.concat(uploadedUrls);
  },

  async submit() {
    if (!this.data.content && this.data.images.length === 0) {
      wx.showToast({ title: '内容或图片至少填一项', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });

    try {
      const images = await this.uploadImages();

      await app.callCloud('moment/create', {
        data: {
          content: this.data.content,
          images,
          location: this.data.location,
          latitude: this.data.latitude,
          longitude: this.data.longitude,
          mood: this.data.mood,
          isShared: this.data.isShared
        }
      });

      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      console.error('Submit error:', err);
      wx.showToast({ title: err.message || '发布失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  }
});
