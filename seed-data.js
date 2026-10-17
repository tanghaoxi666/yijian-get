const SEED_APPLIANCE_CODES = [
  // 空调
  { code: 'E1', appliance: 'ac', applianceName: '空调', title: '室内温度传感器故障', severity: 'warning', brand: '格力/美的/海尔通用', models: '变频空调 C 系列',
    causes: ['室内温度传感器（室温探头）连接线松动或脱落，导致信号无法正常传输', '传感器本身损坏或老化，阻值偏离正常范围', '室内机主板检测电路故障，无法读取传感器数据'],
    solutions: ['打开室内机面板，找到室温传感器插头，检查是否松动或氧化。拔下后重新插紧，确保接触良好。', '使用干棉签轻轻擦拭温度传感器探头表面的灰尘和污垢，避免使用水或清洁剂直接接触。', '关闭空调电源，等待 5 分钟后重新通电开机，观察 E1 错误代码是否消失。', '如以上方法均无效，可能是传感器损坏或主板故障，请联系品牌官方售后进行专业检测和维修。'] },
  { code: 'E2', appliance: 'ac', applianceName: '空调', title: '室内蒸发器温度传感器故障', severity: 'warning', brand: '格力', models: '变频挂机',
    causes: ['蒸发器探头损坏或接触不良', '探头表面结冰导致检测异常'],
    solutions: ['检查蒸发器传感器插头是否牢固', '清理蒸发器探头表面冰霜', '断电重启，若仍存在请更换传感器'] },
  { code: 'E5', appliance: 'ac', applianceName: '空调', title: '室外机通讯故障', severity: 'error', brand: '格力', models: '多联机',
    causes: ['内外机信号线断路或接触不良', '室外机主板故障', '通讯模块损坏'],
    solutions: ['检查内外机连接线是否牢固、有无破损', '测量信号线通断，必要时更换', '联系售后检测主板通讯电路'] },
  { code: 'E6', appliance: 'ac', applianceName: '空调', title: '通讯故障', severity: 'error', brand: '美的', models: '全系列',
    causes: ['室内外通讯线接错或松脱', '室外机无电源', '主板通讯电路损坏'],
    solutions: ['检查通讯线连接是否正确（注意 A/B 线序）', '确认室外机供电正常', '联系售后维修'] },
  { code: 'H5', appliance: 'ac', applianceName: '空调', title: '模块保护', severity: 'error', brand: '格力', models: '变频柜机',
    causes: ['功率模块过热', '模块损坏', '散热不良'],
    solutions: ['检查室外机散热是否通畅，清理冷凝器灰尘', '测量模块温度，过温则停机散热', '模块损坏需联系售后更换'] },
  { code: 'F0', appliance: 'ac', applianceName: '空调', title: '室温传感器故障', severity: 'warning', brand: '海尔', models: '变频空调',
    causes: ['室温传感器开路或短路', '插头接触不良'],
    solutions: ['检查室温传感器接线', '更换同规格传感器'] },
  { code: 'P0', appliance: 'ac', applianceName: '空调', title: 'IPM 模块保护', severity: 'error', brand: '美的', models: '变频空调',
    causes: ['IPM 模块过流/过压/过热', '压缩机卡缸'],
    solutions: ['断电 10 分钟后重启', '检查压缩机是否正常', '联系售后检测 IPM 模块'] },

  // 冰箱
  { code: 'F1', appliance: 'fridge', applianceName: '冰箱', title: '冷藏室温度传感器异常', severity: 'error', brand: '海尔/容声', models: '风冷冰箱',
    causes: ['冷藏室温度检测失灵', '传感器损坏或接线脱落'],
    solutions: ['打开冷藏室，检查传感器位置是否被冰冻覆盖', '检查传感器接线是否牢固', '更换冷藏室温度传感器'] },
  { code: 'F2', appliance: 'fridge', applianceName: '冰箱', title: '冷冻室传感器故障', severity: 'warning', brand: '美的', models: '风冷冰箱',
    causes: ['冷冻室传感器损坏', '插头松脱'],
    solutions: ['检查冷冻室传感器接线', '更换传感器'] },
  { code: 'E1', appliance: 'fridge', applianceName: '冰箱', title: '冷藏蒸发器传感器故障', severity: 'warning', brand: '容声', models: '风冷冰箱',
    causes: ['蒸发器传感器异常'],
    solutions: ['检查冷藏蒸发器传感器', '必要时更换'] },
  { code: 'E2', appliance: 'fridge', applianceName: '冰箱', title: '冷冻蒸发器传感器故障', severity: 'warning', brand: '容声', models: '风冷冰箱',
    causes: ['冷冻蒸发器传感器异常'],
    solutions: ['检查冷冻蒸发器传感器', '必要时更换'] },
  { code: 'E3', appliance: 'fridge', applianceName: '冰箱', title: '环境温度传感器故障', severity: 'info', brand: '海尔', models: '风冷冰箱',
    causes: ['环境传感器异常'],
    solutions: ['检查环境传感器接线', '更换传感器'] },
  { code: 'H', appliance: 'fridge', applianceName: '冰箱', title: '化霜故障', severity: 'warning', brand: '通用', models: '风冷冰箱',
    causes: ['化霜加热管损坏', '化霜温控器故障', '化霜保险丝熔断'],
    solutions: ['检查化霜加热管通断', '检查化霜温控器和保险丝', '更换损坏部件'] },

  // 洗衣机
  { code: 'E1', appliance: 'washer', applianceName: '洗衣机', title: '进水超时', severity: 'warning', brand: '海尔', models: '全自动洗衣机',
    causes: ['水龙头未打开或水压过低', '进水阀过滤网堵塞', '进水阀损坏'],
    solutions: ['打开水龙头，检查水压', '清理进水阀过滤网', '更换进水阀'] },
  { code: 'E2', appliance: 'washer', applianceName: '洗衣机', title: '排水超时', severity: 'warning', brand: '小天鹅', models: '全自动洗衣机',
    causes: ['排水管堵塞或弯折', '排水泵故障', '排水过滤器堵塞'],
    solutions: ['检查排水管是否畅通，清理过滤器', '检查排水泵是否运转', '更换排水泵'] },
  { code: 'E3', appliance: 'washer', applianceName: '洗衣机', title: '脱水不平衡', severity: 'warning', brand: '小天鹅', models: '全自动洗衣机',
    causes: ['衣物分布不均', '洗衣机放置不平', '减振部件故障'],
    solutions: ['打开机盖，重新分布衣物', '调整洗衣机脚垫使机身水平', '检查减振吊杆/弹簧'] },
  { code: 'E4', appliance: 'washer', applianceName: '洗衣机', title: '水位传感器故障', severity: 'warning', brand: '美的', models: '全自动洗衣机',
    causes: ['水位传感器气管脱落/堵塞', '传感器损坏'],
    solutions: ['检查气管是否连接牢固、有无漏气', '清理气管', '更换水位传感器'] },
  { code: 'E5', appliance: 'washer', applianceName: '洗衣机', title: '电机故障', severity: 'error', brand: '海尔', models: '变频洗衣机',
    causes: ['电机烧坏', '电机驱动板故障', '碳刷磨损'],
    solutions: ['检查电机是否有异响、异味', '检测电机阻值', '联系售后更换电机或驱动板'] },
  { code: 'E6', appliance: 'washer', applianceName: '洗衣机', title: '门锁故障', severity: 'warning', brand: '通用', models: '滚筒洗衣机',
    causes: ['门未关到位', '门锁开关损坏', '门锁电路故障'],
    solutions: ['重新关好机门', '检查门锁开关', '更换门锁组件'] },

  // 热水器
  { code: 'E1', appliance: 'heater', applianceName: '热水器', title: '点火失败', severity: 'error', brand: '万家乐/万和', models: '燃气热水器',
    causes: ['燃气阀门未打开', '点火针损坏或积碳', '燃气压力过低', '风压开关故障'],
    solutions: ['检查燃气阀门是否打开', '清理点火针积碳或更换', '检查燃气压力', '检查排烟管是否堵塞，清理后重启'] },
  { code: 'E2', appliance: 'heater', applianceName: '热水器', title: '意外熄火', severity: 'error', brand: '万家乐', models: '燃气热水器',
    causes: ['燃烧中途缺氧', '火焰感应针故障', '燃气供应不稳'],
    solutions: ['保持室内通风', '清理火焰感应针', '检查燃气供应'] },
  { code: 'E4', appliance: 'heater', applianceName: '热水器', title: '出水温度传感器故障', severity: 'info', brand: '美的', models: '电热水器',
    causes: ['出水温度检测不准', '传感器损坏'],
    solutions: ['检查温度传感器接线', '更换传感器'] },
  { code: 'E5', appliance: 'heater', applianceName: '热水器', title: '过热保护', severity: 'error', brand: '海尔', models: '电热水器',
    causes: ['水温过高', '温控器故障', '加热管干烧'],
    solutions: ['立即断电，待水温下降后再使用', '检查温控器设定', '联系售后检测加热管和温控器'] },
  { code: 'E6', appliance: 'heater', applianceName: '热水器', title: '干烧保护', severity: 'error', brand: '通用', models: '电热水器',
    causes: ['水箱缺水加热', '水位检测故障'],
    solutions: ['确保水箱注满水后再通电', '检查水位检测装置', '联系售后维修'] },

  // 电视
  { code: 'E1', appliance: 'tv', applianceName: '电视', title: '无信号', severity: 'info', brand: '通用', models: '智能电视',
    causes: ['信号源选择错误', '信号线未连接', '机顶盒故障'],
    solutions: ['切换到正确的信号源', '检查 HDMI/AV 线连接', '重启机顶盒'] },
  { code: 'E2', appliance: 'tv', applianceName: '电视', title: '背光故障', severity: 'error', brand: '通用', models: 'LED 电视',
    causes: ['背光灯条损坏', '背光驱动板故障'],
    solutions: ['联系售后更换灯条或驱动板'] },
  { code: 'E3', appliance: 'tv', applianceName: '电视', title: '系统卡顿', severity: 'info', brand: '通用', models: '智能电视',
    causes: ['内存不足', '系统缓存过多', '应用冲突'],
    solutions: ['清理后台应用', '恢复出厂设置', '卸载不常用应用'] },

  // 微波炉
  { code: 'E1', appliance: 'microwave', applianceName: '微波炉', title: '门开关故障', severity: 'warning', brand: '美的/格兰仕', models: '微波炉',
    causes: ['炉门未关紧', '门开关损坏', '门钩断裂'],
    solutions: ['重新关好炉门', '检查门开关通断', '更换门开关或门钩'] },
  { code: 'F2', appliance: 'microwave', applianceName: '微波炉', title: '门开关接触不良', severity: 'warning', brand: '格兰仕', models: '微波炉',
    causes: ['炉门未关紧或开关损坏'],
    solutions: ['重新关紧炉门', '检查门开关触点', '更换门开关'] },
  { code: 'E2', appliance: 'microwave', applianceName: '微波炉', title: '磁控管故障', severity: 'error', brand: '通用', models: '微波炉',
    causes: ['磁控管烧坏', '高压保险丝熔断', '高压电容损坏'],
    solutions: ['联系售后更换磁控管', '检查高压保险丝和电容', '高压部件请勿自行拆卸'] },

  // 油烟机
  { code: 'E1', appliance: 'hood', applianceName: '油烟机', title: '电机故障', severity: 'error', brand: '方太/老板', models: '油烟机',
    causes: ['电机烧坏', '启动电容损坏', '叶轮卡死'],
    solutions: ['检查叶轮是否被油污卡死，清理后重试', '检测启动电容', '联系售后更换电机'] },
  { code: 'E2', appliance: 'hood', applianceName: '油烟机', title: '照明故障', severity: 'info', brand: '通用', models: '油烟机',
    causes: ['灯泡损坏', '照明开关故障'],
    solutions: ['更换灯泡', '检查照明开关'] },

  // 消毒柜
  { code: 'E1', appliance: 'sterilizer', applianceName: '消毒柜', title: '温度传感器故障', severity: 'warning', brand: '康宝/美的', models: '消毒柜',
    causes: ['温度传感器损坏', '接线脱落'],
    solutions: ['检查温度传感器接线', '更换传感器'] },
  { code: 'E2', appliance: 'sterilizer', applianceName: '消毒柜', title: '加热管故障', severity: 'error', brand: '通用', models: '消毒柜',
    causes: ['加热管烧坏', '温控器故障'],
    solutions: ['检测加热管阻值', '更换加热管或温控器'] },
];

function buildTools() {
  const cats = {
    encode: ['编码转换', 'arrow-left-right'],
    text: ['文本处理', 'type'],
    image: ['图片工具', 'image'],
    datetime: ['日期时间', 'clock'],
    dev: ['开发工具', 'code-2'],
    calc: ['计算工具', 'calculator'],
    life: ['生活工具', 'coffee'],
    crypto: ['加密解密', 'shield'],
  };
  const defs = {
    encode: [
      ['Base64 编解码', '字符串编解码', 'base64', '12.5k', '3.2k', true],
      ['URL 编解码', 'URL 特殊字符处理', 'url-codec', '8.1k', '2.0k'],
      ['进制转换', '二/八/十/十六进制', 'base-convert', '6.5k', '1.5k'],
      ['JSON 转 XML', '数据格式互转', 'json-xml', '3.2k', '0.8k'],
      ['HTML 转义', 'HTML 实体编解码', 'html-escape', '2.8k', '0.6k'],
      ['Unicode 转码', '字符与 Unicode 互转', 'unicode', '2.1k', '0.5k'],
      ['摩斯电码', '摩斯电码编解码', 'morse', '1.8k', '0.4k'],
      ['Base32 编解码', 'Base32 编解码', 'base32', '1.2k', '0.3k'],
    ],
    text: [
      ['大小写转换', '英文大小写切换', 'case-convert', '5.6k', '1.3k'],
      ['字数统计', '字符/行数统计', 'word-count', '7.8k', '1.9k'],
      ['去除空格', '空白字符清理', 'trim-space', '4.3k', '1.0k'],
      ['文本排序', '行排序去重', 'text-sort', '3.1k', '0.7k'],
      ['文本反转', '字符串倒序', 'text-reverse', '2.5k', '0.6k'],
      ['繁简转换', '繁体简体互转', 'trad-simp', '3.8k', '0.9k'],
      ['文本对比', '两段文本差异', 'text-diff', '2.9k', '0.8k'],
      ['Markdown 转 HTML', 'MD 解析', 'md-html', '1.7k', '0.4k'],
    ],
    image: [
      ['图片压缩', '无损压缩图片', 'image-compress', '11.1k', '3.8k', true],
      ['图片裁剪', '在线裁剪图片', 'image-crop', '6.2k', '1.6k'],
      ['图片旋转', '旋转翻转图片', 'image-rotate', '4.8k', '1.2k'],
      ['格式转换', 'JPG/PNG/WebP', 'image-convert', '5.5k', '1.4k'],
      ['图片加水印', '文字/图片水印', 'image-watermark', '3.9k', '1.0k'],
      ['图片转 Base64', '图片编码', 'image-base64', '8.2k', '2.1k'],
      ['图片拼接', '多张图片合并', 'image-merge', '2.3k', '0.5k'],
      ['图片模糊', '高斯模糊', 'image-blur', '1.9k', '0.4k'],
    ],
    datetime: [
      ['时间戳转换', 'Unix 时间戳与日期互转', 'timestamp', '8.6k', '1.8k'],
      ['日期计算器', '日期加减计算', 'date-calc', '4.5k', '1.1k'],
      ['倒计时', '自定义倒计时', 'countdown', '3.2k', '0.8k'],
      ['世界时钟', '多时区时间', 'world-clock', '2.7k', '0.6k'],
      ['农历转换', '公历农历互转', 'lunar', '3.5k', '0.9k'],
      ['日期差计算', '两日期相差天数', 'date-diff', '2.8k', '0.7k'],
      ['时间格式化', '日期格式化输出', 'date-format', '1.6k', '0.3k'],
      ['工作日计算', '排除节假日', 'workday', '1.3k', '0.3k'],
    ],
    dev: [
      ['JSON 格式化', '美化压缩 JSON 数据', 'json-format', '15.2k', '4.5k', true],
      ['正则测试', '正则表达式测试', 'regex', '6.8k', '1.7k'],
      ['Diff 对比', '文本差异对比', 'diff', '5.1k', '1.3k'],
      ['二维码解析', '识别二维码内容', 'qr-decode', '4.2k', '1.0k'],
      ['HTML 格式化', 'HTML 美化', 'html-format', '3.4k', '0.8k'],
      ['CSS 格式化', 'CSS 美化压缩', 'css-format', '2.9k', '0.7k'],
      ['SQL 格式化', 'SQL 美化', 'sql-format', '2.6k', '0.6k'],
      ['UUID 生成', 'UUID v4 生成', 'uuid', '3.8k', '1.0k'],
      ['SQLite 查看', 'SQLite 文件浏览', 'sqlite', '1.5k', '0.3k'],
      ['JWT 解析', 'JWT Token 解码', 'jwt', '2.2k', '0.5k'],
    ],
    calc: [
      ['颜色取色器', 'RGB/HEX/HSL 颜色转换', 'color-picker', '7.3k', '1.5k'],
      ['单位换算', '长度重量面积等换算', 'unit-convert', '5.4k', '1.2k'],
      ['BMI 计算', '身体质量指数', 'bmi', '4.1k', '1.0k'],
      ['房贷计算', '等额本息/本金', 'mortgage', '3.6k', '0.9k'],
      ['百分比计算', '百分比换算', 'percent', '2.8k', '0.6k'],
      ['科学计算器', '高级计算', 'scientific-calc', '3.9k', '1.1k'],
      ['汇率换算', '货币汇率', 'currency', '4.4k', '1.2k'],
      ['面积体积', '几何计算', 'area-volume', '2.1k', '0.5k'],
      ['温度换算', '摄氏华氏开尔文', 'temp-convert', '1.8k', '0.4k'],
    ],
    life: [
      ['密码生成器', '生成高强度随机密码', 'password-gen', '6.9k', '2.0k'],
      ['二维码生成', '一键生成自定义二维码', 'qrcode-gen', '9.8k', '2.1k', true],
      ['短链生成', '长链接转短链', 'short-link', '3.2k', '0.8k'],
      ['随机数生成', '指定范围随机数', 'random-num', '2.7k', '0.6k'],
      ['抽签决定', '随机选择', 'lucky-draw', '1.9k', '0.4k'],
      ['倒计时器', '番茄钟/倒计时', 'timer', '2.4k', '0.6k'],
      ['记账本', '收支记录', 'ledger', '1.5k', '0.3k'],
      ['纪念日', '重要日期提醒', 'anniversary', '1.2k', '0.3k'],
    ],
    crypto: [
      ['MD5 加密', 'MD5 哈希', 'md5', '5.8k', '1.4k'],
      ['SHA 加密', 'SHA-1/256/512', 'sha', '4.6k', '1.2k'],
      ['AES 加解密', 'AES 对称加密', 'aes', '3.8k', '1.0k'],
      ['RSA 加解密', 'RSA 非对称加密', 'rsa', '2.9k', '0.7k'],
      ['哈希校验', '文件哈希校验', 'hash-check', '2.1k', '0.5k'],
      ['密码强度检测', '密码安全评估', 'pwd-strength', '3.5k', '0.9k'],
      ['凯撒密码', '凯撒位移加密', 'caesar', '1.8k', '0.4k'],
      ['XOR 加密', '异或加密', 'xor', '1.4k', '0.3k'],
    ],
  };

  const tools = [];
  let idx = 1;
  Object.entries(defs).forEach(([catKey, list]) => {
    const [catName, icon] = cats[catKey];
    list.forEach(([name, desc, impl, uses, likes, hot]) => {
      tools.push({
        id: 't_' + (idx++),
        name, desc, icon,
        category: catKey, categoryName: catName,
        impl, uses, likes, hot: hot || false,
      });
    });
  });

  // 扩展到 600+：为每个分类生成批量工具（通用实现）
  const extraByCat = {
    encode: ['Base58 编解码','Base85 编解码','Base45 编解码','Base64URL 编解码','Base16 编解码','UUencode','Quoted-Printable','Punycode','百分号编码','7位编码','Base36 编解码','Base32Hex','Base91 编解码','Base122','Z85 编解码','Ascii85','ROT13 编解码','ROT47 编解码','URL 参数解析','QueryString 拼接','FormData 序列化','JSONP 生成','数据 URI 生成','Blob URL 生成','二进制转文本','文本转二进制','八进制编解码','十进制编解码','十六进制编解码','Base64 图片解码','Base64 转文件','文件转 Base64','UTF-8 编码检测','字符集转换','GBK 转 UTF-8','UTF-8 转 GBK','Unicode 转义','HTML 实体解码','XML 实体编解码','URL 安全 Base64','Base64 行宽格式化','Base58Check','Base62 编解码','Base64 校验','Base32 校验','Base 系列对比','编解码历史记录','批量编解码','多段编解码','嵌套编解码','编解码结果对比'],
    text: ['全半角转换','去重行','行合并','换行符转换','制表符转空格','数字提取','汉字提取','拼音首字母','罗马数字转换','文本加密','英文单词统计','中文字符统计','段落统计','句子统计','最长行统计','最短行统计','平均行长','行号添加','行号移除','首尾空行清理','连续空行合并','行反转','列反转','按列排序','按长度排序','按字母排序','随机排序','行洗牌','固定宽度填充','左对齐','右对齐','居中对齐','文本缩进','文本反缩进','引号配对检查','括号配对检查','Markdown 标题生成','Markdown 表格生成','Markdown 列表生成','HTML 转 Markdown','CSV 转 Markdown','TSV 转 CSV','CSV 转 JSON','JSON 转 CSV','TSV 转 JSON','文本模板填充','占位符替换','正则替换','批量替换','多文件合并','文本差异高亮','拼写检查（英文）','同义词替换','反义词查询','文本摘要生成','关键词提取','词频统计','字符频率统计','大小写句首','标题式大小写','句首字母大写','去除 HTML 标签','提取纯文本'],
    image: ['图片灰度','图片反色','图片圆角','图片边框','图片亮度调整','图片对比度','图片马赛克','图片圆角裁剪','九宫格切图','图片像素化','图片缩放','图片放大','图片缩小','图片等比缩放','图片裁剪自由','图片裁剪圆形','图片裁剪方形','图片水平翻转','图片垂直翻转','图片旋转90度','图片旋转180度','图片旋转270度','图片任意角度旋转','图片透明度调整','图片背景透明','图片背景换色','图片加水印文字','图片加水印图片','图片批量水印','图片色调调整','图片饱和度调整','图片锐化','图片柔化','图片高斯模糊','图片动感模糊','图片径向模糊','图片油画效果','图片素描效果','图片卡通效果','图片怀旧效果','图片冷色调','图片暖色调','图片黑白滤镜','图片底片效果','图片浮雕效果','图片边缘检测','图片二值化','图片阈值处理','图片通道分离','图片通道合并','图片 EXIF 查看','图片 EXIF 清除','图片元数据编辑','图片格式检测','图片大小调整','图片尺寸修改','图片 DPI 设置','图片拼贴','图片堆叠','图片过渡动画','图片帧提取','GIF 帧拆分','GIF 合成'],
    datetime: ['节气查询','星座查询','生肖查询','年龄计算','退休倒计时','夏令时查询','时区转换','UNIX 毫秒转换','ISO 时间解析','相对时间生成','今天是第几周','本周起止日期','本月起止日期','本年起止日期','季度起止日期','月份天数查询','闰年判断','天干地支纪年','五行查询','八字排盘','情人节倒计时','春节倒计时','国庆倒计时','元旦倒计时','生日倒计时','项目天数计算','工期计算','排班表生成','轮班计算','打卡时间计算','加班时长计算','工时统计','请假天数计算','调休计算','考勤统计','预产期计算','怀孕周期','宝宝月龄','疫苗接种时间','体检提醒','车辆年检提醒','驾照到期提醒','护照到期提醒','信用卡还款日','房贷还款日','租金到期日','会员到期提醒','订阅续费提醒','保修期查询','保养周期','下次保养日期','历史上的今天','历史今天事件','日期转时间戳','时间戳转日期','时间戳批量转换','日期格式化自定义','相对时间格式化','友好时间显示','时间轴生成','时间线生成'],
    dev: ['XML 格式化','YAML 格式化','LESS 编译','SCSS 编译','TypeScript 转 JS','Babel 转译','代码压缩 JS','代码压缩 CSS','代码压缩 HTML','Cron 表达式解析','IP 地址换算','子网掩码计算','HTTP 状态码查询','正则生成器','Git 命令速查','Linux 命令速查','Docker 命令速查','Kubernetes 命令速查','npm 命令速查','yarn 命令速查','pnpm 命令速查','pip 命令速查','Maven 命令速查','Gradle 命令速查','SQL 语法检查','SQL 优化建议','SQL 格式化高级','NoSQL 查询生成','Redis 命令速查','MongoDB 查询生成','Elasticsearch 查询','GraphQL 查询生成','RESTful API 设计','API 文档生成','接口 Mock 数据','JSON Schema 生成','JSON 转 TypeScript 接口','JSON 转 Java 类','JSON 转 Go 结构体','JSON 转 Python 类','JSON 转 C# 类','JSON 转 PHP 数组','JSON 转 Swift 结构体','JSON 转 Kotlin 数据类','JSON 转 Dart 类','HTML 转 Pug/Jade','HTML 转 Haml','CSS 转 Stylus','CSS 转 Sass','CSS 选择器优化','CSS 命名建议','JS 代码美化','JS 变量重命名','JS 代码片段管理','代码行数统计','代码注释率统计','圈复杂度计算','代码重复检测','代码片段分享','在线代码运行','代码沙箱','依赖版本检查','package.json 分析','依赖冲突检测','Bundle 体积分析','Tree Shaking 建议','代码分割建议','懒加载建议','SEO Meta 生成','Open Graph 生成','robots.txt 生成','sitemap.xml 生成','.htaccess 生成','nginx 配置生成','CORS 配置生成','CSP 策略生成','CSP 违规解析','Cookie 设置','LocalStorage 操作','SessionStorage 操作','IndexedDB 操作','WebSocket 测试','SSE 测试','gRPC 调试','MQTT 测试','TCP 端口检测','UDP 端口检测','Ping 测试','Traceroute','DNS 解析','WHOIS 查询','SSL 证书检测','HTTP 头分析','重定向链检查','页面加载分析','性能瀑布图','Lighthouse 评分','代码覆盖率'],
    calc: ['利息计算','复利计算','个税计算','年终奖个税','五险一金计算','增值税计算','折扣计算','利润计算','投资回报','净值计算','电阻计算','电容计算','欧姆定律','功率计算','角度弧度换算','进制计算器','存款利息','贷款利息','等额本息计算','等额本金计算','提前还款计算','LPR 利率换算','日利率月利率年利率','日期间隔天数','日期间隔月数','日期间隔年数','工作日天数','节假日查询','二十四节气','七十二候','三伏天查询','三九天查询','梅雨季查询','潮汐时间','日出日落时间','月相查询','黄道吉日','八字五行','星座运势','生肖运势','生日密码','生命灵数','塔罗牌占卜','幸运数字','幸运颜色','姓名笔画','姓名五格','三才配置','车牌号码吉凶','手机号吉凶','QQ号吉凶','门牌号吉凶','楼层选择','房屋面积计算','建筑面积换算','套内面积计算','公摊面积计算','墙体面积计算','地面面积计算','墙面面积计算','瓷砖用量计算','地板用量计算','涂料用量计算','壁纸用量计算','水泥用量计算','沙子用量计算','钢筋用量计算','混凝土用量计算','砖块用量计算','水电费用计算','燃气费用计算','暖气费用计算','物业费计算','停车费计算','贷款月供','信用卡分期','花呗分期','京东白条','分期手续费','实际年化利率','IRR 内部收益率','NPV 净现值','投资回收期','投资收益率','股票盈亏','基金收益','理财产品收益','债券收益','期货保证金','外汇点值','比特币挖矿收益','算力收益','矿机回本周期','云服务成本','服务器成本','CDN 成本','域名费用','SSL 证书费用','邮箱费用','办公软件费用','云存储费用','云数据库费用','带宽费用','流量费用','CPU 使用率','内存使用率','磁盘使用率','网络流量统计','带宽换算','数据量换算','存储单位换算','传输时间计算','下载时间计算','上传时间计算'],
    life: ['掷骰子','抛硬币','转盘抽奖','随机点名','随机分组','随机密码','随机颜色','随机头像','随机昵称','随机签名','字数转换','金额大写','大小写金额','日期转星期','卡路里计算','饮水量计算','睡眠时长','运动消耗','快递时效','手机号归属地','随机笑话','随机情话','随机名言','随机诗词','随机歇后语','随机绕口令','随机脑筋急转弯','随机成语','随机谚语','随机歌词','随机电影台词','随机动漫台词','随机毒鸡汤','随机土味情话','随机早安问候','随机晚安问候','随机生日祝福','随机节日祝福','随机道歉信','随机感谢信','随机请假条','随机辞职报告','随机工作总结','随机述职报告','随机周报','随机月报','随机日报','随机会议纪要','随机邮件模板','随机短信模板','随机朋友圈文案','随机微博文案','随机小红书文案','随机抖音文案','随机标题生成','随机藏头诗','随机押韵句','随机对联','随机春联','随机福字','随机红包祝福语','随机表情包描述','随机头像描述','随机网名','随机个性签名','随机个人简介','随机自我介绍','随机面试自我介绍','随机简历优化','随机求职信','随机推荐信','随机感谢信','随机请假理由','随机离职理由','随机搭讪话术','随机表白话术','随机道歉话术','随机挽回话术','随机聊天话题','随机约会建议','随机礼物推荐','随机餐厅推荐','随机电影推荐','随机音乐推荐','随机书籍推荐','随机游戏推荐','随机旅游目的地','随机穿搭建议','随机发型建议','随机妆容建议','随机菜谱','随机早餐','随机午餐','随机晚餐','随机宵夜','随机零食','随机饮料','随机水果','随机蔬菜','随机肉类','随机海鲜','随机主食','随机汤品','随机甜品','随机茶饮','随机咖啡','随机酒类','随机食材搭配','随机营养搭配','随机减脂餐','随机增肌餐','随机素食','随机清真','随机便当','随机外卖','随机做饭顺序','随机买菜清单'],
    crypto: ['RC4 加解密','DES 加解密','3DES 加解密','Blowfish','HMAC-SHA1','HMAC-SHA256','HMAC-MD5','PBKDF2','Bcrypt','Scrypt','Base64 图片','二维码解码','条形码生成','条形码识别','OCR 文字识别','MD5 碰撞测试','AES-CBC','AES-ECB','AES-CTR','AES-GCM','AES-CFB','AES-OFB','RSA 密钥生成','RSA 签名','RSA 验签','RSA 加密','RSA 解密','ECC 密钥生成','ECC 签名','ECC 验签','DSA 签名','DSA 验签','椭圆曲线加密','Ed25519 签名','Curve25519 密钥交换','Diffie-Hellman 密钥交换','数字证书生成','CSR 生成','自签名证书','证书链验证','证书过期检查','证书指纹','证书序列号','证书主题','证书颁发者','证书有效期','证书用途','证书扩展','证书转换 PEM/DER','证书转换 PFX/P12','证书转换 JKS','证书私钥提取','证书公钥提取','密钥对生成','密钥格式转换','密钥强度检测','密码字典生成','密码哈希','密码加盐','密码加密存储','密码破解模拟','暴力破解检测','彩虹表生成','盐值生成','IV 生成','Nonce 生成','随机数生成器','伪随机数检测','真随机数检测','熵值计算','信息熵','频率分析','词频分析','字符分布','重合指数','Kasiski 检验','Friedman 检验','维吉尼亚密码','栅栏密码','培根密码','波利比奥斯方阵','仿射密码','乘数密码','加法密码','单表替换','多表替换','转轮机密码','Enigma 模拟','Purple 密码','Navajo 密码','Book cipher','格子密码','曲路密码','列移位','行移位','螺旋密码','ZigZag 编码','Playfair 密码','Hill 密码','Vigenere 自动密钥','Beaufort 密码','Variant Beaufort','Running key','One-time pad',' Vernam 密码','ChaCha20','Salsa20','XSalsa20','XChaCha20','Rabbit','Sosemanuk','HC-128','HC-256','SipHash','CityHash','MurmurHash','FarmHash','SpookyHash','xxHash','FNV 哈希','DJB2','SDBM','RS 哈希','JS 哈希','PJW 哈希','ELF 哈希','BKDR 哈希','AP 哈希','CRC8','CRC16','CRC32','CRC64','Adler32','Fletcher16','Fletcher32','校验和计算','文件完整性校验','数字签名验证','消息认证码','零知识证明','同态加密','安全多方计算','秘密共享','Shamir 秘密分享','门限签名','群签名','环签名','盲签名','代理签名','聚合签名','可验证随机函数','哈希链','哈希树','Merkle 树','Merkle 证明','布隆过滤器','计数布隆过滤器','Cuckoo 过滤器','Xor 过滤器']
  };
  Object.entries(extraByCat).forEach(([catKey, names]) => {
    const [catName, icon] = cats[catKey];
    names.forEach(name => {
      tools.push({
        id: 't_' + (idx++),
        name, desc: name, icon,
        category: catKey, categoryName: catName,
        impl: 'generic',
        uses: (Math.random() * 5 + 0.5).toFixed(1) + 'k',
        likes: (Math.random() * 2 + 0.1).toFixed(1) + 'k',
        hot: false,
      });
    });
  });
  return tools;
}

module.exports = { SEED_APPLIANCE_CODES, buildTools };
