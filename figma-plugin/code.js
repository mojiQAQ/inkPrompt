const FONT_REGULAR = { family: 'Inter', style: 'Regular' }
const FONT_MEDIUM = { family: 'Inter', style: 'Medium' }
const FONT_SEMIBOLD = { family: 'Inter', style: 'Semi Bold' }
const FONT_BOLD = { family: 'Inter', style: 'Bold' }

const COLORS = {
  paperBase: { r: 0.9686, g: 0.9569, b: 0.9333 },
  paperStrong: { r: 1, g: 1, b: 1, a: 0.96 },
  paperMuted: { r: 1, g: 1, b: 1, a: 0.78 },
  ink: { r: 0.0667, g: 0.0941, b: 0.1529 },
  inkSoft: { r: 0.3804, g: 0.4353, b: 0.5294 },
  border: { r: 0.0392, g: 0.0392, b: 0.0392, a: 0.08 },
  borderStrong: { r: 0.0392, g: 0.0392, b: 0.0392, a: 0.14 },
  accent: { r: 0.3098, g: 0.2745, b: 0.898 },
  accentSoft: { r: 0.3098, g: 0.2745, b: 0.898, a: 0.1 },
  buttonDarkA: { r: 0.0941, g: 0.0941, b: 0.1059 },
  buttonDarkB: { r: 0.1529, g: 0.1529, b: 0.1647 },
  tagA: { r: 0.3569, g: 0.3569, b: 0.8392 },
  tagB: { r: 0.2353, g: 0.6627, b: 0.5216 },
  white: { r: 1, g: 1, b: 1 }
}

function rgb(color) {
  return {
    r: color.r,
    g: color.g,
    b: color.b
  }
}

function withOpacity(color, opacity) {
  return {
    r: color.r,
    g: color.g,
    b: color.b,
    a: opacity
  }
}

function solidStroke(color) {
  return {
    type: 'SOLID',
    color: rgb(color),
    opacity: color.a === undefined ? 1 : color.a
  }
}

function solidPaint(color) {
  return {
    type: 'SOLID',
    color: rgb(color),
    opacity: color.a === undefined ? 1 : color.a
  }
}

function linearGradient(stops) {
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [1, 0, 0],
      [0, 1, 0]
    ],
    gradientStops: stops
  }
}

function setAutoLayout(node, mode, options = {}) {
  node.layoutMode = mode
  node.primaryAxisSizingMode = options.primaryAxisSizingMode || 'AUTO'
  node.counterAxisSizingMode = options.counterAxisSizingMode || 'AUTO'
  node.primaryAxisAlignItems = options.primaryAxisAlignItems || 'MIN'
  node.counterAxisAlignItems = options.counterAxisAlignItems || 'MIN'
  node.itemSpacing = options.itemSpacing || 0
  node.paddingTop = options.paddingTop || 0
  node.paddingBottom = options.paddingBottom || 0
  node.paddingLeft = options.paddingLeft || 0
  node.paddingRight = options.paddingRight || 0
  node.layoutWrap = options.layoutWrap || 'NO_WRAP'
}

function makeFrame(name, options = {}) {
  const frame = figma.createFrame()
  frame.name = name
  frame.strokes = options.strokes || []
  frame.strokeWeight = options.strokeWeight || 1
  frame.fills = options.fills || []
  frame.cornerRadius = options.cornerRadius || 0
  frame.clipsContent = options.clipsContent === undefined ? false : options.clipsContent
  if (options.resize) {
    frame.resize(options.resize.width, options.resize.height)
  }
  if (options.autoLayout) {
    setAutoLayout(frame, options.autoLayout.mode, options.autoLayout)
  }
  return frame
}

async function makeText(name, content, font, options = {}) {
  await figma.loadFontAsync(font)
  const text = figma.createText()
  text.name = name
  text.fontName = font
  text.characters = content
  text.fontSize = options.fontSize || 14
  text.fills = options.fills || [solidPaint(COLORS.ink)]
  text.lineHeight = options.lineHeight || { unit: 'PIXELS', value: (options.fontSize || 14) * 1.4 }
  if (options.letterSpacing) text.letterSpacing = options.letterSpacing
  if (options.textAutoResize) text.textAutoResize = options.textAutoResize
  if (options.textAlignHorizontal) text.textAlignHorizontal = options.textAlignHorizontal
  return text
}

function makePill(name, label, options = {}) {
  const pill = makeFrame(name, {
    cornerRadius: options.cornerRadius || 999,
    fills: options.fills || [solidPaint(COLORS.paperMuted)],
    strokes: options.strokes || [solidStroke(COLORS.border)],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER',
      itemSpacing: 6,
      paddingTop: options.paddingY || 8,
      paddingBottom: options.paddingY || 8,
      paddingLeft: options.paddingX || 12,
      paddingRight: options.paddingX || 12
    }
  })
  return makeText(`${name}/label`, label, FONT_MEDIUM, {
    fontSize: options.fontSize || 12,
    fills: options.textFills || [solidPaint(COLORS.inkSoft)],
    textAutoResize: 'WIDTH_AND_HEIGHT'
  }).then((text) => {
    pill.appendChild(text)
    return pill
  })
}

async function makeButton(name, label, variant = 'secondary', withChevron = false) {
  const fills = variant === 'primary'
    ? [linearGradient([
        { position: 0, color: rgb(COLORS.buttonDarkA), opacity: 1 },
        { position: 1, color: rgb(COLORS.buttonDarkB), opacity: 1 }
      ])]
    : [solidPaint(COLORS.paperMuted)]

  const button = makeFrame(name, {
    cornerRadius: 999,
    fills,
    strokes: variant === 'primary' ? [] : [solidStroke(COLORS.border)],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER',
      itemSpacing: 8,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 16,
      paddingRight: 16
    }
  })

  const text = await makeText(`${name}/label`, label, FONT_MEDIUM, {
    fontSize: 14,
    fills: [solidPaint(variant === 'primary' ? COLORS.white : COLORS.inkSoft)],
    textAutoResize: 'WIDTH_AND_HEIGHT'
  })
  button.appendChild(text)

  if (withChevron) {
    const chevron = await makeText(`${name}/chevron`, '▾', FONT_MEDIUM, {
      fontSize: 14,
      fills: [solidPaint(COLORS.inkSoft)],
      textAutoResize: 'WIDTH_AND_HEIGHT'
    })
    button.appendChild(chevron)
  }

  return button
}

async function makeTag(label) {
  const tag = makeFrame(`Tag/${label}`, {
    cornerRadius: 999,
    fills: [linearGradient([
      { position: 0, color: rgb(COLORS.tagA), opacity: 1 },
      { position: 1, color: rgb(COLORS.tagB), opacity: 1 }
    ])],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER',
      itemSpacing: 0,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 10,
      paddingRight: 10
    }
  })
  const text = await makeText(`TagText/${label}`, label, FONT_SEMIBOLD, {
    fontSize: 11,
    fills: [solidPaint(COLORS.white)],
    textAutoResize: 'WIDTH_AND_HEIGHT'
  })
  tag.appendChild(text)
  return tag
}

async function makeIconCircle(label) {
  const circle = makeFrame(`Icon/${label}`, {
    cornerRadius: 999,
    fills: [solidPaint(withOpacity(COLORS.white, 0.72))],
    strokes: [solidStroke(COLORS.border)],
    resize: { width: 36, height: 36 },
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'FIXED',
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER'
    }
  })
  const text = await makeText(`IconText/${label}`, label, FONT_MEDIUM, {
    fontSize: 14,
    fills: [solidPaint(COLORS.inkSoft)],
    textAutoResize: 'WIDTH_AND_HEIGHT'
  })
  circle.appendChild(text)
  return circle
}

async function makePromptCanvas(name, expanded) {
  const canvas = makeFrame(name, {
    resize: { width: 1600, height: expanded ? 1480 : 1080 },
    fills: [solidPaint(COLORS.paperBase)]
  })
  canvas.clipsContent = false

  const shell = makeFrame(`${name}/Shell`, {
    resize: { width: 1120, height: 900 },
    cornerRadius: 32,
    fills: [solidPaint(withOpacity(COLORS.white, 0.9))],
    strokes: [solidStroke(COLORS.border)],
    autoLayout: {
      mode: 'VERTICAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'FIXED'
    }
  })
  shell.x = 120
  shell.y = 96
  canvas.appendChild(shell)

  const header = makeFrame(`${name}/Header`, {
    fills: [solidPaint(withOpacity(COLORS.white, 0.78))],
    strokes: [solidStroke(COLORS.border)],
    autoLayout: {
      mode: 'VERTICAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'FIXED',
      itemSpacing: 16,
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24
    }
  })
  header.resize(1120, 156)
  shell.appendChild(header)

  const row1 = makeFrame(`${name}/HeaderRow1`, {
    fills: [],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'AUTO',
      primaryAxisAlignItems: 'SPACE_BETWEEN',
      counterAxisAlignItems: 'CENTER'
    }
  })
  row1.resize(1072, 44)
  header.appendChild(row1)

  const title = await makeText(`${name}/Title`, 'Prompt Detail Title', FONT_SEMIBOLD, {
    fontSize: 16,
    fills: [solidPaint(COLORS.ink)],
    textAutoResize: 'WIDTH_AND_HEIGHT'
  })
  row1.appendChild(title)

  const actionRow = makeFrame(`${name}/Actions`, {
    fills: [],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      itemSpacing: 8,
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER'
    }
  })
  actionRow.layoutAlign = 'INHERIT'
  row1.appendChild(actionRow)
  actionRow.appendChild(await makeButton(`${name}/OptimizeButton`, 'AI 优化', 'primary'))
  actionRow.appendChild(await makeButton(`${name}/TestButton`, '模型测试', 'secondary'))
  actionRow.appendChild(await makeIconCircle('✎'))

  const row2 = makeFrame(`${name}/HeaderRow2`, {
    fills: [],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'AUTO',
      itemSpacing: 8,
      primaryAxisAlignItems: 'MIN',
      counterAxisAlignItems: 'CENTER',
      layoutWrap: 'WRAP'
    }
  })
  row2.resize(1072, 44)
  header.appendChild(row2)
  row2.appendChild(await makePill('Metric/Tokens', '382 tokens'))
  row2.appendChild(await makePill('Metric/Version', 'v12'))
  row2.appendChild(await makePill('Metric/Date', '2026/03/26'))
  row2.appendChild(await makeTag('写作'))
  row2.appendChild(await makeTag('优化中'))
  row2.appendChild(await makeIconCircle('+'))

  const body = makeFrame(`${name}/Body`, {
    fills: [],
    autoLayout: {
      mode: 'VERTICAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'FIXED',
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24
    }
  })
  body.resize(1120, 652)
  shell.appendChild(body)

  const promptCard = makeFrame(`${name}/PromptCard`, {
    cornerRadius: 28,
    fills: [linearGradient([
      { position: 0, color: rgb(withOpacity(COLORS.white, 0.92)), opacity: 1 },
      { position: 1, color: rgb(COLORS.paperBase), opacity: 1 }
    ])],
    strokes: [solidStroke(COLORS.border)],
    autoLayout: {
      mode: 'VERTICAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'FIXED',
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24
    }
  })
  promptCard.resize(1072, 604)
  body.appendChild(promptCard)

  const promptText = await makeText(`${name}/PromptText`, [
    '# 角色',
    '你是一个专业的提示词优化助手。',
    '',
    '# 任务',
    '- 提炼原始意图',
    '- 修正结构和约束',
    '- 输出更稳定的版本',
    '',
    '# 输出要求',
    '使用中文，条理清晰。'
  ].join('\n'), FONT_REGULAR, {
    fontSize: 15,
    fills: [solidPaint(COLORS.ink)],
    lineHeight: { unit: 'PIXELS', value: 28 }
  })
  promptText.resize(1024, 556)
  promptCard.appendChild(promptText)

  const toolbar = makeFrame(`${name}/Toolbar`, {
    fills: [solidPaint(withOpacity(COLORS.white, 0.62))],
    strokes: [solidStroke(COLORS.border)],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'FIXED',
      counterAxisSizingMode: 'AUTO',
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 24,
      paddingRight: 24,
      primaryAxisAlignItems: 'SPACE_BETWEEN',
      counterAxisAlignItems: 'CENTER'
    }
  })
  toolbar.resize(1120, 76)
  shell.appendChild(toolbar)

  const selectRow = makeFrame(`${name}/VersionSelectRow`, {
    fills: [],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      itemSpacing: 8,
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER'
    }
  })
  toolbar.appendChild(selectRow)
  selectRow.appendChild(await makePill('VersionSelect', 'v12 · 2026/03/26', {
    paddingX: 14,
    paddingY: 10,
    fontSize: 14
  }))

  const rightRow = makeFrame(`${name}/ToolbarRight`, {
    fills: [],
    autoLayout: {
      mode: 'HORIZONTAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'AUTO',
      itemSpacing: 8,
      primaryAxisAlignItems: 'CENTER',
      counterAxisAlignItems: 'CENTER'
    }
  })
  toolbar.appendChild(rightRow)
  rightRow.appendChild(await makeButton(`${name}/HistoryButton`, '历史版本', 'secondary', true))

  if (expanded) {
    const history = makeFrame(`${name}/HistoryExpanded`, {
      cornerRadius: 0,
      fills: [solidPaint(withOpacity(COLORS.white, 0.44))],
      strokes: [solidStroke(COLORS.border)],
      autoLayout: {
        mode: 'VERTICAL',
        primaryAxisSizingMode: 'AUTO',
        counterAxisSizingMode: 'FIXED',
        itemSpacing: 12,
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 24,
        paddingRight: 24
      }
    })
    history.resize(1120, 380)
    history.x = shell.x
    history.y = shell.y + shell.height
    canvas.appendChild(history)

    const sectionLabel = await makeText(`${name}/HistoryLabel`, '历史版本展开区', FONT_MEDIUM, {
      fontSize: 13,
      fills: [solidPaint(COLORS.inkSoft)],
      textAutoResize: 'WIDTH_AND_HEIGHT'
    })
    history.appendChild(sectionLabel)

    const historyGrid = makeFrame(`${name}/HistoryGrid`, {
      fills: [],
      autoLayout: {
        mode: 'HORIZONTAL',
        primaryAxisSizingMode: 'FIXED',
        counterAxisSizingMode: 'AUTO',
        itemSpacing: 12
      }
    })
    historyGrid.resize(1072, 296)
    history.appendChild(historyGrid)

    for (let i = 0; i < 2; i += 1) {
      const card = makeFrame(`${name}/HistoryCard${i + 1}`, {
        cornerRadius: 24,
        fills: [solidPaint(withOpacity(COLORS.white, 0.8))],
        strokes: [solidStroke(i === 0 ? COLORS.borderStrong : COLORS.border)],
        autoLayout: {
          mode: 'VERTICAL',
          primaryAxisSizingMode: 'FIXED',
          counterAxisSizingMode: 'FIXED',
          itemSpacing: 12,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 16,
          paddingRight: 16
        }
      })
      card.resize(530, 296)
      historyGrid.appendChild(card)

      const cardHeader = makeFrame(`${name}/HistoryCardHeader${i + 1}`, {
        fills: [],
        autoLayout: {
          mode: 'HORIZONTAL',
          primaryAxisSizingMode: 'FIXED',
          counterAxisSizingMode: 'AUTO',
          primaryAxisAlignItems: 'SPACE_BETWEEN',
          counterAxisAlignItems: 'CENTER'
        }
      })
      cardHeader.resize(498, 24)
      card.appendChild(cardHeader)
      cardHeader.appendChild(await makeText(`${name}/HistoryTitle${i + 1}`, `v${12 - i}`, FONT_SEMIBOLD, {
        fontSize: 16,
        textAutoResize: 'WIDTH_AND_HEIGHT'
      }))
      cardHeader.appendChild(await makePill(`${name}/HistoryToken${i + 1}`, `${360 - i * 22}`))

      card.appendChild(await makeText(`${name}/HistoryDate${i + 1}`, `2026/03/2${6 - i}`, FONT_REGULAR, {
        fontSize: 12,
        fills: [solidPaint(COLORS.inkSoft)],
        textAutoResize: 'WIDTH_AND_HEIGHT'
      }))

      const excerpt = makeFrame(`${name}/Excerpt${i + 1}`, {
        cornerRadius: 18,
        fills: [solidPaint(COLORS.paperBase)],
        autoLayout: {
          mode: 'VERTICAL',
          primaryAxisSizingMode: 'FIXED',
          counterAxisSizingMode: 'FIXED',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 12,
          paddingRight: 12
        }
      })
      excerpt.resize(498, 136)
      card.appendChild(excerpt)
      const excerptText = await makeText(`${name}/ExcerptText${i + 1}`, '版本内容摘要放这里，方便在 Figma 里继续细调版式、按钮和信息密度。', FONT_REGULAR, {
        fontSize: 13,
        fills: [solidPaint(COLORS.inkSoft)],
        lineHeight: { unit: 'PIXELS', value: 22 }
      })
      excerptText.resize(474, 110)
      excerpt.appendChild(excerptText)

      const actionBar = makeFrame(`${name}/HistoryActions${i + 1}`, {
        fills: [],
        autoLayout: {
          mode: 'HORIZONTAL',
          primaryAxisSizingMode: 'AUTO',
          counterAxisSizingMode: 'AUTO',
          itemSpacing: 8
        }
      })
      card.appendChild(actionBar)
      actionBar.appendChild(await makeButton(`${name}/Switch${i + 1}`, i === 0 ? '当前版本' : '切换到这里', i === 0 ? 'primary' : 'secondary'))
      actionBar.appendChild(await makeButton(`${name}/Detail${i + 1}`, '查看详情', 'secondary'))
    }
  }

  return canvas
}

async function main() {
  await Promise.all([
    figma.loadFontAsync(FONT_REGULAR),
    figma.loadFontAsync(FONT_MEDIUM),
    figma.loadFontAsync(FONT_SEMIBOLD),
    figma.loadFontAsync(FONT_BOLD)
  ])

  const page = figma.createPage()
  page.name = 'InkPrompt Prompt Detail'
  await figma.setCurrentPageAsync(page)

  const defaultCanvas = await makePromptCanvas('Prompt Detail / Default', false)
  const expandedCanvas = await makePromptCanvas('Prompt Detail / History Expanded', true)
  expandedCanvas.x = 1760
  expandedCanvas.y = 0
  page.appendChild(defaultCanvas)
  page.appendChild(expandedCanvas)

  figma.currentPage.selection = [defaultCanvas, expandedCanvas]
  figma.viewport.scrollAndZoomIntoView([defaultCanvas, expandedCanvas])
  figma.closePlugin('已生成 Prompt Detail Figma 骨架')
}

main().catch((error) => {
  console.error(error)
  figma.closePlugin(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
})
