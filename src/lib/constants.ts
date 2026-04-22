/**
 * 主形象的 appearanceIndex 值。
 * 所有判断主/子形象的逻辑必须引用此常量，禁止硬编码数字。
 * 子形象的 appearanceIndex 从 PRIMARY_APPEARANCE_INDEX + 1 开始递增。
 */
export const PRIMARY_APPEARANCE_INDEX = 0

// 比例配置（nanobanana 支持的所有比例，按常用程度排序）
export const ASPECT_RATIO_CONFIGS: Record<string, { label: string; isVertical: boolean }> = {
  '16:9': { label: '16:9', isVertical: false },
  '9:16': { label: '9:16', isVertical: true },
  '1:1': { label: '1:1', isVertical: false },
  '3:2': { label: '3:2', isVertical: false },
  '2:3': { label: '2:3', isVertical: true },
  '4:3': { label: '4:3', isVertical: false },
  '3:4': { label: '3:4', isVertical: true },
  '5:4': { label: '5:4', isVertical: false },
  '4:5': { label: '4:5', isVertical: true },
  '21:9': { label: '21:9', isVertical: false },
}

// 配置页面使用的选项列表（从 ASPECT_RATIO_CONFIGS 派生）
export const VIDEO_RATIOS = Object.entries(ASPECT_RATIO_CONFIGS).map(([value, config]) => ({
  value,
  label: config.label
}))

// 获取比例配置
export function getAspectRatioConfig(ratio: string) {
  return ASPECT_RATIO_CONFIGS[ratio] || ASPECT_RATIO_CONFIGS['16:9']
}

export const ANALYSIS_MODELS = [
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'google/gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash-Lite' },
  { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' }
]

export const IMAGE_MODELS = [
  { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' }
]

// 图像模型选项（ 生成完整图片）
export const IMAGE_MODEL_OPTIONS = [
  { value: 'banana', label: 'Banana Pro (FAL)' },
  { value: 'banana-2', label: 'Banana 2 (FAL)' },
  { value: 'gemini-3-pro-image-preview', label: 'Banana (Google)' },
  { value: 'gemini-3-pro-image-preview-batch', label: 'Banana (Google Batch) 省50%' },
  { value: 'doubao-seedream-4-0-250828', label: 'Seedream 4.0' },
  { value: 'doubao-seedream-4-5-251128', label: 'Seedream 4.5' },
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (Google)' },
  { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra' },
  { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast' }
]

// Banana 模型分辨率选项（仅用于九宫格分镜图，单张生成固定2K）
export const BANANA_RESOLUTION_OPTIONS = [
  { value: '2K', label: '2K (推荐，快速)' },
  { value: '4K', label: '4K (高清，较慢)' }
]

// 支持分辨率选择的 Banana 模型
export const BANANA_MODELS = ['banana', 'banana-2', 'gemini-3-pro-image-preview', 'gemini-3-pro-image-preview-batch']

export const VIDEO_MODELS = [
  { value: 'doubao-seedance-2-0-260128', label: 'Seedance 2.0' },
  { value: 'doubao-seedance-2-0-fast-260128', label: 'Seedance 2.0 Fast' },
  { value: 'doubao-seedance-1-0-pro-fast-251015', label: 'Seedance 1.0 Pro Fast' },
  { value: 'doubao-seedance-1-0-pro-fast-251015-batch', label: 'Seedance 1.0 Pro Fast (批量) 省50%' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428', label: 'Seedance 1.0 Lite' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428-batch', label: 'Seedance 1.0 Lite (批量) 省50%' },
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro' },
  { value: 'doubao-seedance-1-5-pro-251215-batch', label: 'Seedance 1.5 Pro (批量) 省50%' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro' },
  { value: 'doubao-seedance-1-0-pro-250528-batch', label: 'Seedance 1.0 Pro (批量) 省50%' },
  { value: 'fal-wan25', label: 'Wan 2.6' },
  { value: 'fal-veo31', label: 'Veo 3.1 Fast' },
  { value: 'fal-sora2', label: 'Sora 2' },
  { value: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video', label: 'Kling 2.5 Turbo Pro' },
  { value: 'fal-ai/kling-video/v3/standard/image-to-video', label: 'Kling 3 Standard' },
  { value: 'fal-ai/kling-video/v3/pro/image-to-video', label: 'Kling 3 Pro' }
]

// SeeDream 批量模型列表（使用 GPU 空闲时间，成本降低50%）
export const SEEDANCE_BATCH_MODELS = [
  'doubao-seedance-1-5-pro-251215-batch',
  'doubao-seedance-1-0-pro-250528-batch',
  'doubao-seedance-1-0-pro-fast-251015-batch',
  'doubao-seedance-1-0-lite-i2v-250428-batch',
]

// 支持生成音频的模型
export const AUDIO_SUPPORTED_MODELS = [
  'doubao-seedance-2-0-260128',
  'doubao-seedance-2-0-fast-260128',
  'doubao-seedance-1-5-pro-251215',
  'doubao-seedance-1-5-pro-251215-batch',
]

// 首尾帧视频模型（能力权威来源是 standards/capabilities；此常量仅作静态兜底展示）
export const FIRST_LAST_FRAME_MODELS = [
  { value: 'doubao-seedance-2-0-260128', label: 'Seedance 2.0 (首尾帧)' },
  { value: 'doubao-seedance-2-0-fast-260128', label: 'Seedance 2.0 Fast (首尾帧)' },
  { value: 'doubao-seedance-1-5-pro-251215', label: 'Seedance 1.5 Pro (首尾帧)' },
  { value: 'doubao-seedance-1-5-pro-251215-batch', label: 'Seedance 1.5 Pro (首尾帧/批量) 省50%' },
  { value: 'doubao-seedance-1-0-pro-250528', label: 'Seedance 1.0 Pro (首尾帧)' },
  { value: 'doubao-seedance-1-0-pro-250528-batch', label: 'Seedance 1.0 Pro (首尾帧/批量) 省50%' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428', label: 'Seedance 1.0 Lite (首尾帧)' },
  { value: 'doubao-seedance-1-0-lite-i2v-250428-batch', label: 'Seedance 1.0 Lite (首尾帧/批量) 省50%' },
  { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 (首尾帧)' },
  { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast (首尾帧)' }
]

export const VIDEO_RESOLUTIONS = [
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' }
]

export const TTS_RATES = [
  { value: '+0%', label: '正常速度 (1.0x)' },
  { value: '+20%', label: '轻微加速 (1.2x)' },
  { value: '+50%', label: '加速 (1.5x)' },
  { value: '+100%', label: '快速 (2.0x)' }
]

export const TTS_VOICES = [
  { value: 'zh-CN-YunxiNeural', label: '云希 (男声)', preview: '男' },
  { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)', preview: '女' },
  { value: 'zh-CN-YunyangNeural', label: '云扬 (男声)', preview: '男' },
  { value: 'zh-CN-XiaoyiNeural', label: '晓伊 (女声)', preview: '女' }
]

export const ART_STYLES = [
	{
	  value: 'xuanji-style',
	  label: '玄机科技风',
	  preview: '玄',
	  promptZh: '玄机科技动画风格，高质量3D建模配合2D渲染质感，人物造型唯美精致、五官立体清秀，东方古风美学，仙侠武侠场景设定，古代服饰与兵器细节考究，战国秦汉历史建筑与场景氛围，宏大史诗感，光影层次丰富细腻，冷暖光对比鲜明，打斗动作流畅富有张力，动态捕捉级别的肢体表现力，发丝与衣袂随动飘动，布料物理感真实，色彩饱和度高、画面通透明亮，近景人物特写时神态生动、情绪张力强，背景场景精细壮观，类似《秦时明月》《天行九歌》《武庚纪》的视觉品质',
	  promptEn: 'Xuanji Studio (Sparkly Key) Chinese 3D animation style, high-quality 3D character modeling with 2D cel-shading rendering look, refined elegant facial features with expressive Eastern aesthetics, ancient Chinese Xianxia and Wuxia costume design with intricate historical detail, Warring States and Qin Dynasty architectural environments, epic grand atmosphere, rich layered lighting with strong warm-cool contrast, fluid dynamic action sequences with motion-capture quality movement, realistic cloth and hair physics simulation — fabric and hair flowing naturally, high color saturation with vibrant transparent visual quality, expressive close-up portrait shots with strong emotional intensity, detailed majestic background environments, visual quality inspired by "Qin’s Moon" (Qin Shi Ming Yue), "Tian Xing Jiu Ge", and "Wu Geng Ji" animation series'
	},
  {
    value: 'american-comic',
    label: '美漫风',
    preview: '美',
    promptZh: '美式漫画风格，粗犷有力的墨线勾勒，强烈明暗对比，肌肉感与英雄主义构图，Marvel/DC漫画质感，动态夸张的肢体姿势，网点纹理背景，色块平涂与局部渐变，厚重饱和的色彩，硬朗的光影切割，近景特写构图，电影分镜感',
    promptEn: 'American comic book style, bold expressive ink outlines, high-contrast chiaroscuro shading, heroic muscular figure composition, Marvel and DC aesthetic, dynamic exaggerated action poses, halftone dot texture backgrounds, flat color fills with spot gradients, heavy saturated color palette, hard dramatic lighting, cinematic close-up framing, panel-composition feel'
  },
  {
    value: 'chinese-comic',
    label: '国漫风（3D）',
    preview: '国',
    promptZh: '中国3D国漫风格，高质量3D渲染，精致写实的人物建模，细腻光滑的皮肤质感，东方美学元素，古风服饰与仙侠场景，光影层次丰富，色彩饱和通透，电影级构图与景深，宏大史诗感，类似《斗罗大陆》《斗破苍穹》《完美世界》动画的视觉水准，面部五官清晰立体，近景特写时神态生动',
    promptEn: 'Chinese 3D animation style, high-quality 3D rendering, refined character modeling with smooth skin texture, Eastern aesthetics with traditional Xianxia costumes and fantasy environments, rich layered lighting and shadows, vivid saturated transparent colors, cinematic composition with depth of field, epic grand atmosphere, visual quality similar to "Soul Land" (Douluo Dalu), "Battle Through the Heavens" (Doupo Cangqiong), and "Perfect World" anime, sharp detailed facial features, expressive close-up portraits'
  },
  {
    value: 'japanese-anime',
    label: '日漫风（2D）',
    preview: '日',
    promptZh: '现代日系TV动画风格，精细赛璐璐上色，清晰干净的手绘线稿，明亮高饱和的色彩，柔和的环境光与发光特效，人物表情生动细腻，发丝与服装纹理精细，类似《鬼灭之刃》《进击的巨人》《咒术回战》的高质量TV动画作画水准，近景特写时五官精准，情绪张力强',
    promptEn: 'Modern Japanese TV anime style, refined cel shading, clean hand-drawn linework, bright vibrant saturated colors, soft ambient glow and light effects, expressive detailed facial emotions, fine hair strands and fabric texture, high-quality animation drawing standard similar to Demon Slayer (Kimetsu no Yaiba), Attack on Titan, and Jujutsu Kaisen, precise facial features in close-up shots, strong emotional intensity'
  },
  {
    value: 'realistic',
    label: '真人写实',
    preview: '实',
    promptZh: '真实电影级画面质感，逼真的人物皮肤纹理与五官细节，自然光与专业影棚布光结合，浅景深人像虚化，色调温暖饱满，专业电影摄影构图，8K超清分辨率，无AI生成痕迹，真实感极强，类似Netflix高制作网剧的画面品质，面部毛孔、睫毛、发丝细节清晰可见，情绪表达自然真实',
    promptEn: 'Photorealistic cinematic quality, lifelike human skin texture with detailed pores and facial features, natural light combined with professional studio lighting, shallow depth of field portrait bokeh, warm rich cinematic color grading, professional film composition, 8K ultra-high resolution, zero AI artifacts, hyper-realistic, visual quality comparable to high-budget Netflix live-action drama, sharp details on eyelashes, hair strands, and skin texture, natural and authentic emotional expression'
  }
]

export type ArtStyleValue = (typeof ART_STYLES)[number]['value']

export function isArtStyleValue(value: unknown): value is ArtStyleValue {
  return typeof value === 'string' && ART_STYLES.some((style) => style.value === value)
}

/**
 * 🔥 实时从 ART_STYLES 常量获取风格 prompt
 * 这是获取风格 prompt 的唯一正确方式，确保始终使用最新的常量定义
 * 
 * @param artStyle - 风格标识符，如 'realistic', 'american-comic' 等
 * @returns 对应的风格 prompt，如果找不到则返回空字符串
 */
export function getArtStylePrompt(
  artStyle: string | null | undefined,
  locale: 'zh' | 'en',
): string {
  if (!artStyle) return ''
  const style = ART_STYLES.find(s => s.value === artStyle)
  if (!style) return ''
  return locale === 'en' ? style.promptEn : style.promptZh
}

// 角色形象生成的系统后缀（始终添加到提示词末尾，不显示给用户）- 左侧面部特写+右侧三视图
export const CHARACTER_PROMPT_SUFFIX_ZH = '角色设定图，画面分为左右两个区域：【左侧区域】占约1/3宽度，是角色的正面特写（如果是人类则展示完整正脸，如果是动物/生物则展示最具辨识度的正面形态）；【右侧区域】占约2/3宽度，是角色三视图横向排列（从左到右依次为：正面全身、侧面全身、背面全身），三视图高度一致。纯白色背景，无其他元素。'
export const CHARACTER_PROMPT_SUFFIX_EN = 'Character reference sheet with two sections: [Left section] approximately 1/3 width, showing the character\'s front face close-up (full face for humans, most distinctive front view for animals/creatures); [Right section] approximately 2/3 width, showing exactly three turnaround views arranged horizontally (from left to right: front full-body, side full-body, back full-body), all three views at consistent height. Pure white background, no other elements, strictly three views only.'

// 根据 locale 返回对应的后缀
export function getCharacterPromptSuffix(locale: 'zh' | 'en'): string {
  return locale === 'en' ? CHARACTER_PROMPT_SUFFIX_EN : CHARACTER_PROMPT_SUFFIX_ZH
}

// 兼容旧代码的默认后缀（中文）
export const CHARACTER_PROMPT_SUFFIX = CHARACTER_PROMPT_SUFFIX_ZH

// 道具图片生成的系统后缀（固定白底三视图资产图）
export const PROP_PROMPT_SUFFIX = '道具设定图，画面分为左右两个区域：【左侧区域】占约1/3宽度，是道具主体的主视图特写；【右侧区域】占约2/3宽度，是同一道具的三视图横向排列（从左到右依次为：正面、侧面、背面），三视图高度一致。纯白色背景，主体居中完整展示，无人物、无手部、无桌面陈设、无环境背景、无其他元素。'

// 场景图片生成的系统后缀（已禁用四视图，直接生成单张场景图）
export const LOCATION_PROMPT_SUFFIX = ''

// 角色资产图生成比例（当前角色设定图实际使用 3:2）
export const CHARACTER_ASSET_IMAGE_RATIO = '3:2'
// 历史保留：旧注释中曾写 16:9，但当前资产图生成统一以 CHARACTER_ASSET_IMAGE_RATIO 为准
export const CHARACTER_IMAGE_RATIO = CHARACTER_ASSET_IMAGE_RATIO
// 角色图片尺寸（用于Seedream API）
export const CHARACTER_IMAGE_SIZE = '3840x2160'  // 16:9 横版
// 角色图片尺寸（用于Banana API）
export const CHARACTER_IMAGE_BANANA_RATIO = CHARACTER_ASSET_IMAGE_RATIO

// 道具图片生成比例（与角色资产图保持一致）
export const PROP_IMAGE_RATIO = CHARACTER_ASSET_IMAGE_RATIO

// 场景图片生成比例（1:1 正方形单张场景）
export const LOCATION_IMAGE_RATIO = '1:1'
// 场景图片尺寸（用于Seedream API）- 4K
export const LOCATION_IMAGE_SIZE = '4096x4096'  // 1:1 正方形 4K
// 场景图片尺寸（用于Banana API）
export const LOCATION_IMAGE_BANANA_RATIO = '1:1'

// 从提示词中移除角色系统后缀（用于显示给用户）
// 注意：由于历史数据可能存储了中文或英文后缀，需要同时尝试移除两种
export function removeCharacterPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  // 同时尝试移除中文和英文后缀，确保历史数据也能正确清理
  let result = prompt.replace(CHARACTER_PROMPT_SUFFIX_ZH, '').trim()
  result = result.replace(CHARACTER_PROMPT_SUFFIX_EN, '').trim()
  return result
}

// 添加角色系统后缀到提示词（用于生成图片）
export function addCharacterPromptSuffix(prompt: string, locale: 'zh' | 'en' = 'zh'): string {
  const suffix = getCharacterPromptSuffix(locale)
  if (!prompt) return suffix
  const cleanPrompt = removeCharacterPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? (locale === 'en' ? ', ' : '，') : ''}${suffix}`
}

export function removePropPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(PROP_PROMPT_SUFFIX, '').replace(/，$/, '').trim()
}

export function addPropPromptSuffix(prompt: string): string {
  if (!prompt) return PROP_PROMPT_SUFFIX
  const cleanPrompt = removePropPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? '，' : ''}${PROP_PROMPT_SUFFIX}`
}

// 从提示词中移除场景系统后缀（用于显示给用户）
export function removeLocationPromptSuffix(prompt: string): string {
  if (!prompt) return ''
  return prompt.replace(LOCATION_PROMPT_SUFFIX, '').replace(/，$/, '').trim()
}

// 添加场景系统后缀到提示词（用于生成图片）
export function addLocationPromptSuffix(prompt: string): string {
  // 后缀为空时直接返回原提示词
  if (!LOCATION_PROMPT_SUFFIX) return prompt || ''
  if (!prompt) return LOCATION_PROMPT_SUFFIX
  const cleanPrompt = removeLocationPromptSuffix(prompt)
  return `${cleanPrompt}${cleanPrompt ? '，' : ''}${LOCATION_PROMPT_SUFFIX}`
}

/**
 * 构建角色介绍字符串（用于发送给 AI，帮助理解"我"和称呼对应的角色）
 * @param characters - 角色列表，需要包含 name 和 introduction 字段
 * @returns 格式化的角色介绍字符串
 */
export function buildCharactersIntroduction(characters: Array<{ name: string; introduction?: string | null }>): string {
  if (!characters || characters.length === 0) return '暂无角色介绍'

  const introductions = characters
    .filter(c => c.introduction && c.introduction.trim())
    .map(c => `- ${c.name}：${c.introduction}`)

  if (introductions.length === 0) return '暂无角色介绍'

  return introductions.join('\n')
}

// ============================================================
// 分辨率映射表（aspectRatio + resolution → 像素尺寸）
// ============================================================

export type ResolutionKey = '1K' | '2K' | '4K'
export type AspectRatioKey = '1:1' | '1:4' | '1:8' | '2:3' | '3:2' | '3:4' | '4:1' | '4:3' | '4:5' | '5:4' | '8:1' | '9:16' | '16:9' | '21:9'

/**
 * 默认图像分辨率档位（当用户未配置时的兜底值）
 */
export const DEFAULT_IMAGE_RESOLUTION: ResolutionKey = '1K'

/**
 * 分辨率映射表
 * 根据 aspectRatio 和 resolution 查询具体的像素尺寸 (width, height)
 */
export const RESOLUTION_TABLE: Record<AspectRatioKey, Record<ResolutionKey, [number, number]>> = {
  '1:1': { '1K': [1024, 1024], '2K': [2048, 2048], '4K': [4096, 4096] },
  '1:4': { '1K': [512, 2048], '2K': [1024, 4096], '4K': [2048, 8192] },
  '1:8': { '1K': [384, 3072], '2K': [768, 6144], '4K': [1536, 12288] },
  '2:3': { '1K': [848, 1264], '2K': [1696, 2528], '4K': [3392, 5056] },
  '3:2': { '1K': [1264, 848], '2K': [2528, 1696], '4K': [5056, 3392] },
  '3:4': { '1K': [896, 1200], '2K': [1792, 2400], '4K': [3584, 4800] },
  '4:1': { '1K': [2048, 512], '2K': [4096, 1024], '4K': [8192, 2048] },
  '4:3': { '1K': [1200, 896], '2K': [2400, 1792], '4K': [4800, 3584] },
  '4:5': { '1K': [928, 1152], '2K': [1856, 2304], '4K': [3712, 4608] },
  '5:4': { '1K': [1152, 928], '2K': [2304, 1856], '4K': [4608, 3712] },
  '8:1': { '1K': [3072, 384], '2K': [6144, 768], '4K': [12288, 1536] },
  '9:16': { '1K': [768, 1376], '2K': [1536, 2752], '4K': [3072, 5504] },
  '16:9': { '1K': [1376, 768], '2K': [2752, 1536], '4K': [5504, 3072] },
  '21:9': { '1K': [1584, 672], '2K': [3168, 1344], '4K': [6336, 2688] },
}

/**
 * 根据 aspectRatio 和 resolution 查询像素尺寸
 * @param aspectRatio - 宽高比，如 '3:2', '16:9'
 * @param resolution - 分辨率档位，如 '1K', '2K', '4K'
 * @returns 像素尺寸字符串，如 '5056x3392'，找不到时返回 undefined
 */
export function resolvePixelSize(
  aspectRatio: string | undefined | null,
  resolution: string | undefined | null,
): string | undefined {
  if (!aspectRatio || !resolution) return undefined

  const ratio = aspectRatio.trim() as AspectRatioKey
  const res = resolution.trim() as ResolutionKey

  const table = RESOLUTION_TABLE[ratio]
  if (!table) return undefined

  const pixels = table[res]
  if (!pixels) return undefined

  return `${pixels[0]}x${pixels[1]}`
}

/**
 * 根据 aspectRatio 和 resolution 查询宽度和高度（分离返回）
 * @param aspectRatio - 宽高比
 * @param resolution - 分辨率档位
 * @returns { width, height } 或 undefined
 */
export function resolvePixelDimensions(
  aspectRatio: string | undefined | null,
  resolution: string | undefined | null,
): { width: number; height: number } | undefined {
  if (!aspectRatio || !resolution) return undefined

  const ratio = aspectRatio.trim() as AspectRatioKey
  const res = resolution.trim() as ResolutionKey

  const table = RESOLUTION_TABLE[ratio]
  if (!table) return undefined

  const pixels = table[res]
  if (!pixels) return undefined

  return { width: pixels[0], height: pixels[1] }
}
