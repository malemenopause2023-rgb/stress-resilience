const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

module.exports = async function handler(req, res) {
  try {
    const {
      brs_total, brs_avg, brs_judge,
      soc_total, soc_judge,
      soc_understand, soc_manage, soc_meaning,
      age_group, company_code,
      brs_answers, soc_answers
    } = req.body

    const cookieHeader = req.headers.cookie || ''
    let lineUid = null
    let lineName = null
    cookieHeader.split(';').forEach(c => {
      const parts = c.trim().split('=')
      const key = parts[0]
      const val = parts.slice(1).join('=')
      if (key === 'line_uid') lineUid = val
      if (key === 'line_name') lineName = decodeURIComponent(val)
    })

    const cc = company_code || null

    const { data: scoreData, error: scoreError } = await supabase
      .from('stress_scores')
      .insert({
        line_uid: lineUid,
        line_name: lineName,
        age_group,
        company_code: cc,
        brs_total, brs_avg, brs_judge,
        soc_total, soc_judge,
        soc_understand, soc_manage, soc_meaning
      })
      .select()
      .single()

    if (scoreError) return res.status(500).json({ error: scoreError })

    const scoreId = scoreData.id

    const brsQList = [
      '困難な出来事が起きても、すぐに立ち直ることができる。',
      'ストレスが多い出来事から立ち直るのに、長くはかからない。',
      'なにか不遇な出来事が起きた時に、立ち直るのは難しい。',
      'ささいな問題があっても、たいていやり過ごせる。',
      '人生における遅れを取り戻すのに、時間がかかる。',
      'つらい状況を通り抜けるのに、長い時間がかかる。'
    ]
    const brsLabels = ['まったくあてはまらない','ややあてはまらない','どちらともいえない','ややあてはまる','かなりあてはまる']
    const brsReverse = [false, false, true, false, true, true]

    const socQList = [
      '人生で起きる出来事が予期できない・混沌としていると感じるか？',
      '身の回りの出来事や変化を理解できると感じるか？',
      '自分の感情や考えがまとまらない（混乱する）ことがあるか？',
      '今後の見通しが立たないと感じることがあるか？',
      '予期せぬ困難が起きても、なんとかなる・解決策があると思えるか？',
      '周囲の人々やリソース（助け）を頼りにできると感じるか？',
      '不当なことや災難が起きた時、「なぜ自分だけが」と打ちのめされるか？',
      '自分の役割や課題を適切にこなせていると感じるか？',
      '日々の生活や仕事にやりがい・価値を感じているか？',
      '人生の中で起きる出来事には意味があると思えるか？',
      '関わっている物事に対して関心や情熱を持てているか？',
      '自分の人生を自分でコントロールできている感覚があるか？',
      '将来に対して希望や目標を持っているか？'
    ]
    const socReverse = [true, false, true, true, false, false, true, false, false, false, false, false, false]

    const details = []

    if (brs_answers) {
      brs_answers.forEach((val, i) => {
        const displayVal = brsReverse[i] ? (6 - val) : val
        details.push({
          score_id: scoreId,
          line_uid: lineUid,
          line_name: lineName,
          company_code: cc,
          test_type: 'BRS',
          question_no: i + 1,
          question_text: brsQList[i],
          answer_value: val,
          answer_label: brsLabels[val - 1]
        })
      })
    }

    if (soc_answers) {
      const socLabels = ['1','2','3','4','5','6','7']
      soc_answers.forEach((val, i) => {
        details.push({
          score_id: scoreId,
          line_uid: lineUid,
          line_name: lineName,
          company_code: cc,
          test_type: 'SOC',
          question_no: i + 1,
          question_text: socQList[i],
          answer_value: val,
