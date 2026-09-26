/**
 * The copy the SDK's own pairing UI shows, carried by the package.
 *
 * The dialog strings (PairingStrings) are the ones `@zoreal/oauth2-react`
 * ships, table for table, so a web app and a native app from the same
 * relying party say the same thing in the same language. The native UI adds a
 * few of its own (NativeStrings): the wait while ZOREAL ID on this phone has
 * the request, the prompt when ZOREAL ID is not installed, and the two ways to
 * switch between this phone and another device.
 *
 * No i18n runtime. A frozen record and one `{time}` substitution is the whole
 * requirement, and a dependency here would be inherited by every host app.
 * `strings()` resolves BCP 47 down to the set carried; anything unknown falls
 * back to English rather than rendering a key.
 */

export interface PairingStrings {
  /** Dialog title while the code is still unscanned. */
  title: string;
  /** Dialog title when the request is for verified identity attributes. */
  titleIdentify: string;
  /** Dialog title when the request is a presence check and not a login. */
  titlePresence: string;
  /** Dialog title once the request is waiting in the app. */
  titleApprove: string;
  bodyScan: string;
  bodyApprove: string;
  bodyEnrolling: string;
  waiting: string;
  waitingApproval: string;
  /** Carries `{time}`, substituted with mm:ss. */
  expiresIn: string;
  secured: string;
  noIdTitle: string;
  noIdBody: string;
  cancel: string;
  close: string;
  qrAlt: string;
  /** The default label of the sign-in button. */
  buttonContinue: string;
}

const en: PairingStrings = {
  title: 'Scan to sign in',
  titleIdentify: 'Scan to verify your identity',
  titlePresence: 'Scan to prove you are a real human',
  titleApprove: 'Approve on your phone',
  bodyScan: 'Scan with your phone camera or the ZOREAL ID app.',
  bodyApprove: 'Approve the login in your ZOREAL ID app.',
  bodyEnrolling: 'Finish setting up ZOREAL ID on your phone, then approve the login.',
  waiting: 'Waiting for scan',
  waitingApproval: 'Waiting for approval',
  expiresIn: 'Expires in {time}',
  secured: 'Proof-of-Human verification by ZOREAL',
  noIdTitle: 'No ZOREAL ID yet?',
  noIdBody: 'Scan the same code to download the app and create one for free. It only takes a minute.',
  cancel: 'Cancel',
  close: 'Close',
  qrAlt: 'QR code to sign in with ZOREAL',
  buttonContinue: 'Continue with ZOREAL',
};

const TRANSLATIONS: Record<string, PairingStrings> = {
  en,
  sv: {
    title: 'Skanna för att logga in',
    titleIdentify: 'Skanna för att verifiera din identitet',
    titlePresence: 'Skanna för att bevisa att du är en riktig människa',
    titleApprove: 'Godkänn på telefonen',
    bodyScan: 'Skanna med telefonens kamera eller ZOREAL ID-appen.',
    bodyApprove: 'Godkänn inloggningen i ZOREAL ID-appen.',
    bodyEnrolling: 'Slutför konfigurationen av ZOREAL ID på telefonen och godkänn sedan inloggningen.',
    waiting: 'Väntar på skanning',
    waitingApproval: 'Väntar på godkännande',
    expiresIn: 'Upphör om {time}',
    secured: 'Proof-of-Human-verifiering av ZOREAL',
    noIdTitle: 'Har du inget ZOREAL ID?',
    noIdBody: 'Skanna samma kod för att ladda ner appen och skapa ett gratis. Det tar bara en minut.',
    cancel: 'Avbryt',
    close: 'Stäng',
    qrAlt: 'QR-kod för att logga in med ZOREAL',
    buttonContinue: 'Fortsätt med ZOREAL',
  },
  es: {
    title: 'Escanea para iniciar sesión',
    titleIdentify: 'Escanea para verificar tu identidad',
    titlePresence: 'Escanea para demostrar que eres una persona real',
    titleApprove: 'Apruébalo en tu teléfono',
    bodyScan: 'Escanea con la cámara de tu teléfono o con la app ZOREAL ID.',
    bodyApprove: 'Aprueba el inicio de sesión en tu app ZOREAL ID.',
    bodyEnrolling: 'Termina de configurar ZOREAL ID en tu teléfono y luego aprueba el inicio de sesión.',
    waiting: 'Esperando el escaneo',
    waitingApproval: 'Esperando aprobación',
    expiresIn: 'Caduca en {time}',
    secured: 'Verificación Proof-of-Human de ZOREAL',
    noIdTitle: '¿Aún no tienes ZOREAL ID?',
    noIdBody: 'Escanea el mismo código para descargar la app y crear una gratis. Solo toma un minuto.',
    cancel: 'Cancelar',
    close: 'Cerrar',
    qrAlt: 'Código QR para iniciar sesión con ZOREAL',
    buttonContinue: 'Continuar con ZOREAL',
  },
  pt: {
    title: 'Digitalize para entrar',
    titleIdentify: 'Digitalize para verificar a sua identidade',
    titlePresence: 'Digitalize para provar que é uma pessoa real',
    titleApprove: 'Aprove no seu telefone',
    bodyScan: 'Digitalize com a câmara do seu telefone ou com a app ZOREAL ID.',
    bodyApprove: 'Aprove o login no app ZOREAL ID.',
    bodyEnrolling: 'Termine de configurar o ZOREAL ID no seu telefone e depois aprove o login.',
    waiting: 'Aguardando digitalização',
    waitingApproval: 'Aguardando aprovação',
    expiresIn: 'Expira em {time}',
    secured: 'Verificação Proof-of-Human da ZOREAL',
    noIdTitle: 'Ainda não tem ZOREAL ID?',
    noIdBody: 'Digitalize o mesmo código para baixar o app e criar uma conta grátis. Leva só um minuto.',
    cancel: 'Cancelar',
    close: 'Fechar',
    qrAlt: 'Código QR para entrar com ZOREAL',
    buttonContinue: 'Continuar com ZOREAL',
  },
  fr: {
    title: 'Scannez pour vous connecter',
    titleIdentify: 'Scannez pour vérifier votre identité',
    titlePresence: 'Scannez pour prouver que vous êtes bien un humain',
    titleApprove: 'Approuvez sur votre téléphone',
    bodyScan: "Scannez avec l'appareil photo de votre téléphone ou l'app ZOREAL ID.",
    bodyApprove: 'Approuvez la connexion dans votre app ZOREAL ID.',
    bodyEnrolling: 'Terminez la configuration de ZOREAL ID sur votre téléphone, puis approuvez la connexion.',
    waiting: 'En attente du scan',
    waitingApproval: "En attente d'approbation",
    expiresIn: 'Expire dans {time}',
    secured: 'Vérification Proof-of-Human par ZOREAL',
    noIdTitle: "Pas encore de ZOREAL ID ?",
    noIdBody: "Scannez le même code pour télécharger l'app et en créer un gratuitement. Cela prend une minute.",
    cancel: 'Annuler',
    close: 'Fermer',
    qrAlt: 'Code QR pour se connecter avec ZOREAL',
    buttonContinue: 'Continuer avec ZOREAL',
  },
  de: {
    title: 'Zum Anmelden scannen',
    titleIdentify: 'Scannen, um Ihre Identität zu verifizieren',
    titlePresence: 'Scannen, um zu beweisen, dass Sie ein echter Mensch sind',
    titleApprove: 'Auf dem Handy bestätigen',
    bodyScan: 'Mit der Handykamera oder der ZOREAL ID App scannen.',
    bodyApprove: 'Anmeldung in der ZOREAL ID App bestätigen.',
    bodyEnrolling: 'ZOREAL ID auf dem Handy fertig einrichten und dann die Anmeldung bestätigen.',
    waiting: 'Warten auf Scan',
    waitingApproval: 'Warten auf Bestätigung',
    expiresIn: 'Läuft ab in {time}',
    secured: 'Proof-of-Human-Verifizierung von ZOREAL',
    noIdTitle: 'Noch keine ZOREAL ID?',
    noIdBody: 'Denselben Code scannen, um die App zu laden und kostenlos eine zu erstellen. Dauert nur eine Minute.',
    cancel: 'Abbrechen',
    close: 'Schließen',
    qrAlt: 'QR-Code für die Anmeldung mit ZOREAL',
    buttonContinue: 'Weiter mit ZOREAL',
  },
  ru: {
    title: 'Отсканируйте, чтобы войти',
    titleIdentify: 'Отсканируйте, чтобы подтвердить личность',
    titlePresence: 'Отсканируйте, чтобы доказать, что вы реальный человек',
    titleApprove: 'Подтвердите на телефоне',
    bodyScan: 'Отсканируйте камерой телефона или через приложение ZOREAL ID.',
    bodyApprove: 'Подтвердите вход в приложении ZOREAL ID.',
    bodyEnrolling: 'Завершите настройку ZOREAL ID на телефоне, затем подтвердите вход.',
    waiting: 'Ожидание сканирования',
    waitingApproval: 'Ожидание подтверждения',
    expiresIn: 'Истекает через {time}',
    secured: 'Проверка Proof-of-Human от ZOREAL',
    noIdTitle: 'Ещё нет ZOREAL ID?',
    noIdBody: 'Отсканируйте тот же код, чтобы скачать приложение и создать его бесплатно. Это займёт минуту.',
    cancel: 'Отмена',
    close: 'Закрыть',
    qrAlt: 'QR-код для входа через ZOREAL',
    buttonContinue: 'Продолжить с ZOREAL',
  },
  ja: {
    title: 'スキャンしてログイン',
    titleIdentify: 'スキャンして本人確認',
    titlePresence: 'スキャンして実在の人物であることを証明',
    titleApprove: 'スマートフォンで承認',
    bodyScan: 'スマートフォンのカメラまたはZOREAL IDアプリでスキャンしてください。',
    bodyApprove: 'ZOREAL IDアプリでログインを承認してください。',
    bodyEnrolling: 'スマートフォンでZOREAL IDの設定を完了し、ログインを承認してください。',
    waiting: 'スキャン待ち',
    waitingApproval: '承認待ち',
    expiresIn: '有効期限まで {time}',
    secured: 'ZOREALによるProof-of-Human認証',
    noIdTitle: 'ZOREAL IDをお持ちでないですか？',
    noIdBody: '同じコードをスキャンしてアプリをダウンロードし、無料で作成できます。1分ほどで完了します。',
    cancel: 'キャンセル',
    close: '閉じる',
    qrAlt: 'ZOREALでログインするためのQRコード',
    buttonContinue: 'ZOREALで続行',
  },
  hi: {
    title: 'साइन इन करने के लिए स्कैन करें',
    titleIdentify: 'अपनी पहचान सत्यापित करने के लिए स्कैन करें',
    titlePresence: 'यह साबित करने के लिए स्कैन करें कि आप एक वास्तविक इंसान हैं',
    titleApprove: 'अपने फोन पर स्वीकृत करें',
    bodyScan: 'अपने फोन के कैमरे या ZOREAL ID ऐप से स्कैन करें।',
    bodyApprove: 'अपने ZOREAL ID ऐप में लॉगिन स्वीकृत करें।',
    bodyEnrolling: 'अपने फोन पर ZOREAL ID सेटअप पूरा करें, फिर लॉगिन स्वीकृत करें।',
    waiting: 'स्कैन की प्रतीक्षा है',
    waitingApproval: 'स्वीकृति की प्रतीक्षा है',
    expiresIn: '{time} में समाप्त',
    secured: 'ZOREAL द्वारा Proof-of-Human सत्यापन',
    noIdTitle: 'अभी तक ZOREAL ID नहीं है?',
    noIdBody: 'ऐप डाउनलोड करने और मुफ्त में एक बनाने के लिए वही कोड स्कैन करें। इसमें बस एक मिनट लगता है।',
    cancel: 'रद्द करें',
    close: 'बंद करें',
    qrAlt: 'ZOREAL से साइन इन करने के लिए QR कोड',
    buttonContinue: 'ZOREAL के साथ जारी रखें',
  },
  zhs: {
    title: '扫码登录',
    titleIdentify: '扫码验证身份',
    titlePresence: '扫码证明您是真人',
    titleApprove: '在手机上批准',
    bodyScan: '使用手机相机或 ZOREAL ID 应用扫描。',
    bodyApprove: '请在 ZOREAL ID 应用中批准登录。',
    bodyEnrolling: '请在手机上完成 ZOREAL ID 设置，然后批准登录。',
    waiting: '等待扫描',
    waitingApproval: '等待批准',
    expiresIn: '{time} 后失效',
    secured: '由 ZOREAL 提供的 Proof-of-Human 验证',
    noIdTitle: '还没有 ZOREAL ID？',
    noIdBody: '扫描同一个二维码即可下载应用并免费创建，只需一分钟。',
    cancel: '取消',
    close: '关闭',
    qrAlt: '使用 ZOREAL 登录的二维码',
    buttonContinue: '使用 ZOREAL 继续',
  },
  zht: {
    title: '掃碼登入',
    titleIdentify: '掃碼驗證身分',
    titlePresence: '掃碼證明您是真人',
    titleApprove: '在手機上核准',
    bodyScan: '使用手機相機或 ZOREAL ID 應用程式掃描。',
    bodyApprove: '請在 ZOREAL ID 應用程式中核准登入。',
    bodyEnrolling: '請在手機上完成 ZOREAL ID 設定，然後核准登入。',
    waiting: '等待掃描',
    waitingApproval: '等待核准',
    expiresIn: '{time} 後失效',
    secured: '由 ZOREAL 提供的 Proof-of-Human 驗證',
    noIdTitle: '還沒有 ZOREAL ID？',
    noIdBody: '掃描同一個 QR code 即可下載應用程式並免費建立，只需一分鐘。',
    cancel: '取消',
    close: '關閉',
    qrAlt: '使用 ZOREAL 登入的 QR code',
    buttonContinue: '使用 ZOREAL 繼續',
  },
  ar: {
    title: 'امسح لتسجيل الدخول',
    titleIdentify: 'امسح للتحقق من هويتك',
    titlePresence: 'امسح لإثبات أنك إنسان حقيقي',
    titleApprove: 'وافق على هاتفك',
    bodyScan: 'امسح باستخدام كاميرا هاتفك أو تطبيق ZOREAL ID.',
    bodyApprove: 'وافق على تسجيل الدخول في تطبيق ZOREAL ID.',
    bodyEnrolling: 'أكمل إعداد ZOREAL ID على هاتفك، ثم وافق على تسجيل الدخول.',
    waiting: 'في انتظار المسح',
    waitingApproval: 'في انتظار الموافقة',
    expiresIn: 'تنتهي الصلاحية خلال {time}',
    secured: 'التحقق من Proof-of-Human بواسطة ZOREAL',
    noIdTitle: 'ليس لديك ZOREAL ID بعد؟',
    noIdBody: 'امسح الرمز نفسه لتنزيل التطبيق وإنشاء حساب مجاني. يستغرق الأمر دقيقة واحدة فقط.',
    cancel: 'إلغاء',
    close: 'إغلاق',
    qrAlt: 'رمز QR لتسجيل الدخول باستخدام ZOREAL',
    buttonContinue: 'المتابعة باستخدام ZOREAL',
  },
  ko: {
    title: '스캔하여 로그인',
    titleIdentify: '스캔하여 신원 확인',
    titlePresence: '스캔하여 실제 사람임을 증명',
    titleApprove: '휴대폰에서 승인',
    bodyScan: '휴대폰 카메라 또는 ZOREAL ID 앱으로 스캔하세요.',
    bodyApprove: 'ZOREAL ID 앱에서 로그인을 승인하세요.',
    bodyEnrolling: '휴대폰에서 ZOREAL ID 설정을 완료한 후 로그인을 승인하세요.',
    waiting: '스캔 대기 중',
    waitingApproval: '승인 대기 중',
    expiresIn: '{time} 후 만료',
    secured: 'ZOREAL의 Proof-of-Human 인증',
    noIdTitle: '아직 ZOREAL ID가 없으신가요?',
    noIdBody: '같은 코드를 스캔해 앱을 내려받고 무료로 만드세요. 1분이면 됩니다.',
    cancel: '취소',
    close: '닫기',
    qrAlt: 'ZOREAL로 로그인하기 위한 QR 코드',
    buttonContinue: 'ZOREAL로 계속',
  },
  // Български
  bg: {
    title: 'Сканирайте за вход',
    titleIdentify: 'Сканирайте, за да потвърдите самоличността си',
    titlePresence: 'Сканирайте, за да докажете, че сте истински човек',
    titleApprove: 'Потвърдете на телефона си',
    bodyScan: 'Сканирайте с камерата на телефона или с приложението ZOREAL ID.',
    bodyApprove: 'Потвърдете входа в приложението ZOREAL ID.',
    bodyEnrolling: 'Довършете настройката на ZOREAL ID на телефона си, след което потвърдете входа.',
    waiting: 'Изчакване на сканиране',
    waitingApproval: 'Изчакване на потвърждение',
    expiresIn: 'Изтича след {time}',
    secured: 'Проверка Proof-of-Human от ZOREAL',
    noIdTitle: 'Все още нямате ZOREAL ID?',
    noIdBody: 'Сканирайте същия код, за да изтеглите приложението и да си създадете безплатен акаунт. Отнема само минута.',
    cancel: 'Отказ',
    close: 'Затвори',
    qrAlt: 'QR код за вход със ZOREAL',
    buttonContinue: 'Продължи със ZOREAL',
  },
  // বাংলা
  bn: {
    title: 'সাইন ইন করতে স্ক্যান করুন',
    titleIdentify: 'আপনার পরিচয় যাচাই করতে স্ক্যান করুন',
    titlePresence: 'আপনি একজন প্রকৃত মানুষ তা প্রমাণ করতে স্ক্যান করুন',
    titleApprove: 'আপনার ফোনে অনুমোদন করুন',
    bodyScan: 'আপনার ফোনের ক্যামেরা বা ZOREAL ID অ্যাপ দিয়ে স্ক্যান করুন।',
    bodyApprove: 'আপনার ZOREAL ID অ্যাপে লগইন অনুমোদন করুন।',
    bodyEnrolling: 'আপনার ফোনে ZOREAL ID সেটআপ সম্পূর্ণ করুন, তারপর লগইন অনুমোদন করুন।',
    waiting: 'স্ক্যানের অপেক্ষায়',
    waitingApproval: 'অনুমোদনের অপেক্ষায়',
    expiresIn: '{time} পরে মেয়াদ শেষ হবে',
    secured: 'ZOREAL দ্বারা Proof-of-Human যাচাইকরণ',
    noIdTitle: 'এখনো ZOREAL ID নেই?',
    noIdBody: 'অ্যাপ ডাউনলোড করে বিনামূল্যে একটি তৈরি করতে একই কোড স্ক্যান করুন। এতে মাত্র এক মিনিট সময় লাগে।',
    cancel: 'বাতিল',
    close: 'বন্ধ',
    qrAlt: 'ZOREAL দিয়ে সাইন ইন করার জন্য QR কোড',
    buttonContinue: 'ZOREAL দিয়ে চালিয়ে যান',
  },
  // Bosanski
  bs: {
    title: 'Skenirajte za prijavu',
    titleIdentify: 'Skenirajte da potvrdite svoj identitet',
    titlePresence: 'Skenirajte da dokažete da ste stvarna osoba',
    titleApprove: 'Odobrite na svom telefonu',
    bodyScan: 'Skenirajte kamerom svog telefona ili aplikacijom ZOREAL ID.',
    bodyApprove: 'Odobrite prijavu u aplikaciji ZOREAL ID.',
    bodyEnrolling: 'Završite podešavanje ZOREAL ID-a na svom telefonu, a zatim odobrite prijavu.',
    waiting: 'Čeka se skeniranje',
    waitingApproval: 'Čeka se odobrenje',
    expiresIn: 'Ističe za {time}',
    secured: 'ZOREAL Proof-of-Human verifikacija',
    noIdTitle: 'Nemate ZOREAL ID?',
    noIdBody: 'Skenirajte isti kod da preuzmete aplikaciju i besplatno ga napravite. Traje samo minutu.',
    cancel: 'Otkaži',
    close: 'Zatvori',
    qrAlt: 'QR kod za prijavu putem ZOREAL-a',
    buttonContinue: 'Nastavi sa ZOREAL-om',
  },
  // Čeština
  cs: {
    title: 'Přihlaste se naskenováním',
    titleIdentify: 'Naskenujte pro ověření totožnosti',
    titlePresence: 'Naskenujte a prokažte, že jste skutečný člověk',
    titleApprove: 'Potvrďte v telefonu',
    bodyScan: 'Naskenujte fotoaparátem telefonu nebo aplikací ZOREAL ID.',
    bodyApprove: 'Potvrďte přihlášení v aplikaci ZOREAL ID.',
    bodyEnrolling: 'Dokončete nastavení ZOREAL ID v telefonu a poté potvrďte přihlášení.',
    waiting: 'Čekání na naskenování',
    waitingApproval: 'Čekání na potvrzení',
    expiresIn: 'Vyprší za {time}',
    secured: 'Ověření Proof-of-Human od ZOREAL',
    noIdTitle: 'Ještě nemáte ZOREAL ID?',
    noIdBody: 'Naskenováním stejného kódu si stáhnete aplikaci a zdarma vytvoříte ZOREAL ID. Zabere to jen minutu.',
    cancel: 'Zrušit',
    close: 'Zavřít',
    qrAlt: 'QR kód pro přihlášení pomocí ZOREAL',
    buttonContinue: 'Pokračovat se ZOREAL',
  },
  // Dansk
  da: {
    title: 'Scan for at logge ind',
    titleIdentify: 'Scan for at bekræfte din identitet',
    titlePresence: 'Scan for at bevise, at du er et rigtigt menneske',
    titleApprove: 'Godkend på din telefon',
    bodyScan: 'Scan med telefonens kamera eller ZOREAL ID-appen.',
    bodyApprove: 'Godkend login i din ZOREAL ID-app.',
    bodyEnrolling: 'Færdiggør opsætningen af ZOREAL ID på din telefon, og godkend derefter login.',
    waiting: 'Venter på scanning',
    waitingApproval: 'Venter på godkendelse',
    expiresIn: 'Udløber om {time}',
    secured: 'Proof-of-Human-verificering af ZOREAL',
    noIdTitle: 'Har du ikke et ZOREAL ID endnu?',
    noIdBody: 'Scan den samme kode for at hente appen og oprette et gratis. Det tager kun et minut.',
    cancel: 'Annuller',
    close: 'Luk',
    qrAlt: 'QR-kode til at logge ind med ZOREAL',
    buttonContinue: 'Fortsæt med ZOREAL',
  },
  // Ελληνικά
  el: {
    title: 'Σάρωση για σύνδεση',
    titleIdentify: 'Σάρωση για επαλήθευση ταυτότητας',
    titlePresence: 'Σάρωση για να αποδείξετε ότι είστε πραγματικός άνθρωπος',
    titleApprove: 'Έγκριση από το κινητό σας',
    bodyScan: 'Σαρώστε με την κάμερα του κινητού σας ή την εφαρμογή ZOREAL ID.',
    bodyApprove: 'Εγκρίνετε τη σύνδεση στην εφαρμογή ZOREAL ID.',
    bodyEnrolling: 'Ολοκληρώστε τη ρύθμιση του ZOREAL ID στο κινητό σας και έπειτα εγκρίνετε τη σύνδεση.',
    waiting: 'Αναμονή σάρωσης',
    waitingApproval: 'Αναμονή έγκρισης',
    expiresIn: 'Λήγει σε {time}',
    secured: 'Επαλήθευση Proof-of-Human από τη ZOREAL',
    noIdTitle: 'Δεν έχετε ακόμα ZOREAL ID;',
    noIdBody: 'Σαρώστε τον ίδιο κωδικό για να κατεβάσετε την εφαρμογή και να δημιουργήσετε ένα δωρεάν. Χρειάζεται μόνο ένα λεπτό.',
    cancel: 'Άκυρο',
    close: 'Κλείσιμο',
    qrAlt: 'Κωδικός QR για σύνδεση με ZOREAL',
    buttonContinue: 'Συνέχεια με ZOREAL',
  },
  // Español (LA)
  'es-419': {
    title: 'Escanea para iniciar sesión',
    titleIdentify: 'Escanea para verificar tu identidad',
    titlePresence: 'Escanea para demostrar que eres una persona real',
    titleApprove: 'Aprueba desde tu celular',
    bodyScan: 'Escanea con la cámara de tu celular o con la app ZOREAL ID.',
    bodyApprove: 'Aprueba el inicio de sesión en tu app ZOREAL ID.',
    bodyEnrolling: 'Termina de configurar ZOREAL ID en tu celular y luego aprueba el inicio de sesión.',
    waiting: 'Esperando escaneo',
    waitingApproval: 'Esperando aprobación',
    expiresIn: 'Expira en {time}',
    secured: 'Verificación Proof-of-Human de ZOREAL',
    noIdTitle: '¿Todavía no tienes ZOREAL ID?',
    noIdBody: 'Escanea el mismo código para descargar la app y crear uno gratis. Solo toma un minuto.',
    cancel: 'Cancelar',
    close: 'Cerrar',
    qrAlt: 'Código QR para iniciar sesión con ZOREAL',
    buttonContinue: 'Continuar con ZOREAL',
  },
  // Suomi
  fi: {
    title: 'Kirjaudu sisään skannaamalla',
    titleIdentify: 'Vahvista henkilöllisyytesi skannaamalla',
    titlePresence: 'Todista skannaamalla, että olet oikea ihminen',
    titleApprove: 'Hyväksy puhelimessasi',
    bodyScan: 'Skannaa puhelimesi kameralla tai ZOREAL ID -sovelluksella.',
    bodyApprove: 'Hyväksy kirjautuminen ZOREAL ID -sovelluksessasi.',
    bodyEnrolling: 'Viimeistele ZOREAL ID -sovelluksen käyttöönotto puhelimellasi ja hyväksy sitten kirjautuminen.',
    waiting: 'Odotetaan skannausta',
    waitingApproval: 'Odotetaan hyväksyntää',
    expiresIn: 'Vanhenee {time} kuluttua',
    secured: 'ZOREALin Proof-of-Human-vahvistus',
    noIdTitle: 'Eikö sinulla ole vielä ZOREAL ID:tä?',
    noIdBody: 'Skannaa sama koodi ladataksesi sovelluksen ja luodaksesi tunnuksen ilmaiseksi. Se vie vain minuutin.',
    cancel: 'Peruuta',
    close: 'Sulje',
    qrAlt: 'QR-koodi ZOREAL-kirjautumista varten',
    buttonContinue: 'Jatka ZOREALilla',
  },
  // עברית
  he: {
    title: 'סרוק כדי להתחבר',
    titleIdentify: 'סרוק כדי לאמת את זהותך',
    titlePresence: 'סרוק כדי להוכיח שאתה אדם אמיתי',
    titleApprove: 'אשר בטלפון שלך',
    bodyScan: 'סרוק באמצעות מצלמת הטלפון שלך או אפליקציית ZOREAL ID.',
    bodyApprove: 'אשר את ההתחברות באפליקציית ZOREAL ID שלך.',
    bodyEnrolling: 'סיים להגדיר את ZOREAL ID בטלפון שלך, ואז אשר את ההתחברות.',
    waiting: 'ממתין לסריקה',
    waitingApproval: 'ממתין לאישור',
    expiresIn: 'יפוג בעוד {time}',
    secured: 'אימות Proof-of-Human מבית ZOREAL',
    noIdTitle: 'עדיין אין לך ZOREAL ID?',
    noIdBody: 'סרוק את אותו הקוד כדי להוריד את האפליקציה וליצור אחד בחינם. זה לוקח רק דקה.',
    cancel: 'ביטול',
    close: 'סגור',
    qrAlt: 'קוד QR להתחברות עם ZOREAL',
    buttonContinue: 'המשך עם ZOREAL',
  },
  // Hrvatski
  hr: {
    title: 'Skenirajte za prijavu',
    titleIdentify: 'Skenirajte za potvrdu identiteta',
    titlePresence: 'Skenirajte kako biste dokazali da ste stvarna osoba',
    titleApprove: 'Odobrite na svom mobitelu',
    bodyScan: 'Skenirajte kamerom svog mobitela ili aplikacijom ZOREAL ID.',
    bodyApprove: 'Odobrite prijavu u aplikaciji ZOREAL ID.',
    bodyEnrolling: 'Dovršite postavljanje ZOREAL ID-a na svom mobitelu, a zatim odobrite prijavu.',
    waiting: 'Čeka se skeniranje',
    waitingApproval: 'Čeka se odobrenje',
    expiresIn: 'Ističe za {time}',
    secured: 'ZOREAL Proof-of-Human provjera',
    noIdTitle: 'Nemate ZOREAL ID?',
    noIdBody: 'Skenirajte isti kod da preuzmete aplikaciju i besplatno ga izradite. Traje samo minutu.',
    cancel: 'Odustani',
    close: 'Zatvori',
    qrAlt: 'QR kod za prijavu putem ZOREAL-a',
    buttonContinue: 'Nastavi sa ZOREAL-om',
  },
  // Magyar
  hu: {
    title: 'Bejelentkezés beolvasással',
    titleIdentify: 'Olvassa be a személyazonossága igazolásához',
    titlePresence: 'Olvassa be annak igazolásához, hogy valódi ember',
    titleApprove: 'Jóváhagyás a telefonján',
    bodyScan: 'Olvassa be a telefonja kamerájával, vagy a ZOREAL ID alkalmazással.',
    bodyApprove: 'Hagyja jóvá a bejelentkezést a ZOREAL ID alkalmazásban.',
    bodyEnrolling: 'Fejezze be a ZOREAL ID beállítását a telefonján, majd hagyja jóvá a bejelentkezést.',
    waiting: 'Várakozás beolvasásra',
    waitingApproval: 'Várakozás jóváhagyásra',
    expiresIn: 'Lejár {time} múlva',
    secured: 'Proof-of-Human hitelesítés a ZOREAL-tól',
    noIdTitle: 'Még nincs ZOREAL ID-je?',
    noIdBody: 'Olvassa be ugyanazt a kódot az alkalmazás letöltéséhez, és hozzon létre egyet ingyenesen. Mindössze egy percet vesz igénybe.',
    cancel: 'Mégse',
    close: 'Bezárás',
    qrAlt: 'QR-kód a ZOREAL-lal való bejelentkezéshez',
    buttonContinue: 'Folytatás a ZOREAL-lal',
  },
  // Bahasa Indonesia
  id: {
    title: 'Pindai untuk masuk',
    titleIdentify: 'Pindai untuk memverifikasi identitas Anda',
    titlePresence: 'Pindai untuk membuktikan bahwa Anda manusia sungguhan',
    titleApprove: 'Setujui di ponsel Anda',
    bodyScan: 'Pindai dengan kamera ponsel atau aplikasi ZOREAL ID.',
    bodyApprove: 'Setujui proses masuk di aplikasi ZOREAL ID Anda.',
    bodyEnrolling: 'Selesaikan pengaturan ZOREAL ID di ponsel Anda, lalu setujui proses masuk.',
    waiting: 'Menunggu pemindaian',
    waitingApproval: 'Menunggu persetujuan',
    expiresIn: 'Berakhir dalam {time}',
    secured: 'Verifikasi Proof-of-Human oleh ZOREAL',
    noIdTitle: 'Belum punya ZOREAL ID?',
    noIdBody: 'Pindai kode yang sama untuk mengunduh aplikasi dan membuat akun secara gratis. Hanya butuh waktu satu menit.',
    cancel: 'Batal',
    close: 'Tutup',
    qrAlt: 'Kode QR untuk masuk dengan ZOREAL',
    buttonContinue: 'Lanjutkan dengan ZOREAL',
  },
  // Italiano
  it: {
    title: 'Scansiona per accedere',
    titleIdentify: 'Scansiona per verificare la tua identità',
    titlePresence: 'Scansiona per dimostrare di essere una persona reale',
    titleApprove: 'Approva sul tuo telefono',
    bodyScan: 'Scansiona con la fotocamera del telefono o con l\'app ZOREAL ID.',
    bodyApprove: 'Approva l\'accesso nell\'app ZOREAL ID.',
    bodyEnrolling: 'Completa la configurazione di ZOREAL ID sul telefono, poi approva l\'accesso.',
    waiting: 'In attesa della scansione',
    waitingApproval: 'In attesa di approvazione',
    expiresIn: 'Scade tra {time}',
    secured: 'Verifica Proof-of-Human di ZOREAL',
    noIdTitle: 'Non hai ancora uno ZOREAL ID?',
    noIdBody: 'Scansiona lo stesso codice per scaricare l\'app e crearne uno gratis. Basta un minuto.',
    cancel: 'Annulla',
    close: 'Chiudi',
    qrAlt: 'Codice QR per accedere con ZOREAL',
    buttonContinue: 'Continua con ZOREAL',
  },
  // Bahasa Melayu
  ms: {
    title: 'Imbas untuk log masuk',
    titleIdentify: 'Imbas untuk mengesahkan identiti anda',
    titlePresence: 'Imbas untuk membuktikan anda manusia sebenar',
    titleApprove: 'Luluskan di telefon anda',
    bodyScan: 'Imbas dengan kamera telefon atau aplikasi ZOREAL ID.',
    bodyApprove: 'Luluskan log masuk dalam aplikasi ZOREAL ID anda.',
    bodyEnrolling: 'Selesaikan persediaan ZOREAL ID di telefon anda, kemudian luluskan log masuk.',
    waiting: 'Menunggu imbasan',
    waitingApproval: 'Menunggu kelulusan',
    expiresIn: 'Tamat tempoh dalam {time}',
    secured: 'Pengesahan Proof-of-Human oleh ZOREAL',
    noIdTitle: 'Belum ada ZOREAL ID?',
    noIdBody: 'Imbas kod yang sama untuk memuat turun aplikasi dan cipta satu secara percuma. Hanya mengambil masa seminit.',
    cancel: 'Batal',
    close: 'Tutup',
    qrAlt: 'Kod QR untuk log masuk dengan ZOREAL',
    buttonContinue: 'Teruskan dengan ZOREAL',
  },
  // Nederlands
  nl: {
    title: 'Scan om in te loggen',
    titleIdentify: 'Scan om je identiteit te verifiëren',
    titlePresence: 'Scan om te bewijzen dat je een echt mens bent',
    titleApprove: 'Keur goed op je telefoon',
    bodyScan: 'Scan met de camera van je telefoon of de ZOREAL ID-app.',
    bodyApprove: 'Keur de aanmelding goed in je ZOREAL ID-app.',
    bodyEnrolling: 'Rond het instellen van ZOREAL ID op je telefoon af en keur daarna de aanmelding goed.',
    waiting: 'Wachten op scan',
    waitingApproval: 'Wachten op goedkeuring',
    expiresIn: 'Verloopt over {time}',
    secured: 'Proof-of-Human-verificatie door ZOREAL',
    noIdTitle: 'Nog geen ZOREAL ID?',
    noIdBody: 'Scan dezelfde code om de app te downloaden en gratis een account aan te maken. Dit duurt maar een minuut.',
    cancel: 'Annuleren',
    close: 'Sluiten',
    qrAlt: 'QR-code om in te loggen met ZOREAL',
    buttonContinue: 'Doorgaan met ZOREAL',
  },
  // Norsk
  no: {
    title: 'Skann for å logge inn',
    titleIdentify: 'Skann for å bekrefte identiteten din',
    titlePresence: 'Skann for å bevise at du er et ekte menneske',
    titleApprove: 'Godkjenn på telefonen din',
    bodyScan: 'Skann med telefonens kamera eller ZOREAL ID-appen.',
    bodyApprove: 'Godkjenn innloggingen i ZOREAL ID-appen din.',
    bodyEnrolling: 'Fullfør oppsettet av ZOREAL ID på telefonen din, og godkjenn deretter innloggingen.',
    waiting: 'Venter på skanning',
    waitingApproval: 'Venter på godkjenning',
    expiresIn: 'Utløper om {time}',
    secured: 'Proof-of-Human-verifisering av ZOREAL',
    noIdTitle: 'Har du ikke ZOREAL ID ennå?',
    noIdBody: 'Skann den samme koden for å laste ned appen og opprette en gratis. Det tar bare et minutt.',
    cancel: 'Avbryt',
    close: 'Lukk',
    qrAlt: 'QR-kode for å logge inn med ZOREAL',
    buttonContinue: 'Fortsett med ZOREAL',
  },
  // Polski
  pl: {
    title: 'Zeskanuj, aby się zalogować',
    titleIdentify: 'Zeskanuj, aby zweryfikować swoją tożsamość',
    titlePresence: 'Zeskanuj, aby udowodnić, że jesteś prawdziwym człowiekiem',
    titleApprove: 'Zatwierdź w telefonie',
    bodyScan: 'Zeskanuj aparatem telefonu lub aplikacją ZOREAL ID.',
    bodyApprove: 'Zatwierdź logowanie w aplikacji ZOREAL ID.',
    bodyEnrolling: 'Dokończ konfigurację ZOREAL ID w telefonie, a następnie zatwierdź logowanie.',
    waiting: 'Czekanie na skan',
    waitingApproval: 'Czekanie na zatwierdzenie',
    expiresIn: 'Wygasa za {time}',
    secured: 'Weryfikacja Proof-of-Human od ZOREAL',
    noIdTitle: 'Nie masz jeszcze ZOREAL ID?',
    noIdBody: 'Zeskanuj ten sam kod, aby pobrać aplikację i bezpłatnie utworzyć ZOREAL ID. Zajmie to tylko minutę.',
    cancel: 'Anuluj',
    close: 'Zamknij',
    qrAlt: 'Kod QR do logowania za pomocą ZOREAL',
    buttonContinue: 'Kontynuuj z ZOREAL',
  },
  // Português (BR)
  'pt-br': {
    title: 'Escaneie para entrar',
    titleIdentify: 'Escaneie para verificar sua identidade',
    titlePresence: 'Escaneie para provar que você é uma pessoa real',
    titleApprove: 'Aprove no seu celular',
    bodyScan: 'Escaneie com a câmera do seu celular ou com o app ZOREAL ID.',
    bodyApprove: 'Aprove o login no app ZOREAL ID.',
    bodyEnrolling: 'Termine de configurar o ZOREAL ID no seu celular e depois aprove o login.',
    waiting: 'Aguardando escaneamento',
    waitingApproval: 'Aguardando aprovação',
    expiresIn: 'Expira em {time}',
    secured: 'Verificação Proof-of-Human da ZOREAL',
    noIdTitle: 'Ainda não tem um ZOREAL ID?',
    noIdBody: 'Escaneie o mesmo código para baixar o app e criar um de graça. Leva só um minuto.',
    cancel: 'Cancelar',
    close: 'Fechar',
    qrAlt: 'Código QR para entrar com ZOREAL',
    buttonContinue: 'Continuar com ZOREAL',
  },
  // Română
  ro: {
    title: 'Scanați pentru conectare',
    titleIdentify: 'Scanați pentru a vă verifica identitatea',
    titlePresence: 'Scanați pentru a dovedi că sunteți o persoană reală',
    titleApprove: 'Aprobați de pe telefon',
    bodyScan: 'Scanați cu camera telefonului sau cu aplicația ZOREAL ID.',
    bodyApprove: 'Aprobați conectarea în aplicația ZOREAL ID.',
    bodyEnrolling: 'Finalizați configurarea ZOREAL ID pe telefon, apoi aprobați conectarea.',
    waiting: 'Se așteaptă scanarea',
    waitingApproval: 'Se așteaptă aprobarea',
    expiresIn: 'Expiră în {time}',
    secured: 'Verificare Proof-of-Human de la ZOREAL',
    noIdTitle: 'Nu aveți încă un ZOREAL ID?',
    noIdBody: 'Scanați același cod pentru a descărca aplicația și a crea unul gratuit. Durează doar un minut.',
    cancel: 'Anulează',
    close: 'Închide',
    qrAlt: 'Cod QR pentru conectare cu ZOREAL',
    buttonContinue: 'Continuați cu ZOREAL',
  },
  // Српски
  sr: {
    title: 'Скенирајте за пријаву',
    titleIdentify: 'Скенирајте да потврдите свој идентитет',
    titlePresence: 'Скенирајте да докажете да сте права особа',
    titleApprove: 'Одобрите на свом телефону',
    bodyScan: 'Скенирајте камером свог телефона или апликацијом ZOREAL ID.',
    bodyApprove: 'Одобрите пријаву у апликацији ZOREAL ID.',
    bodyEnrolling: 'Довршите подешавање ZOREAL ID-а на свом телефону, па одобрите пријаву.',
    waiting: 'Чека се скенирање',
    waitingApproval: 'Чека се одобрење',
    expiresIn: 'Истиче за {time}',
    secured: 'ZOREAL Proof-of-Human верификација',
    noIdTitle: 'Немате ZOREAL ID?',
    noIdBody: 'Скенирајте исти код да преузмете апликацију и бесплатно га направите. Траје само минут.',
    cancel: 'Откажи',
    close: 'Затвори',
    qrAlt: 'QR код за пријаву преко ZOREAL-а',
    buttonContinue: 'Настави са ZOREAL-ом',
  },
  // ไทย
  th: {
    title: 'สแกนเพื่อเข้าสู่ระบบ',
    titleIdentify: 'สแกนเพื่อยืนยันตัวตนของคุณ',
    titlePresence: 'สแกนเพื่อพิสูจน์ว่าคุณเป็นมนุษย์จริง',
    titleApprove: 'อนุมัติบนโทรศัพท์ของคุณ',
    bodyScan: 'สแกนด้วยกล้องโทรศัพท์หรือแอป ZOREAL ID',
    bodyApprove: 'อนุมัติการเข้าสู่ระบบในแอป ZOREAL ID ของคุณ',
    bodyEnrolling: 'ตั้งค่า ZOREAL ID บนโทรศัพท์ของคุณให้เสร็จสิ้น แล้วอนุมัติการเข้าสู่ระบบ',
    waiting: 'รอการสแกน',
    waitingApproval: 'รอการอนุมัติ',
    expiresIn: 'หมดอายุใน {time}',
    secured: 'การยืนยันตัวตน Proof-of-Human โดย ZOREAL',
    noIdTitle: 'ยังไม่มี ZOREAL ID ใช่ไหม',
    noIdBody: 'สแกนโค้ดเดียวกันเพื่อดาวน์โหลดแอปและสร้างบัญชีฟรี ใช้เวลาเพียงนาทีเดียว',
    cancel: 'ยกเลิก',
    close: 'ปิด',
    qrAlt: 'คิวอาร์โค้ดสำหรับเข้าสู่ระบบด้วย ZOREAL',
    buttonContinue: 'ดำเนินการต่อด้วย ZOREAL',
  },
  // Tagalog
  tl: {
    title: 'I-scan para mag-sign in',
    titleIdentify: 'I-scan para i-verify ang iyong pagkakakilanlan',
    titlePresence: 'I-scan para patunayang tunay kang tao',
    titleApprove: 'I-approve sa iyong telepono',
    bodyScan: 'I-scan gamit ang camera ng iyong telepono o ang ZOREAL ID app.',
    bodyApprove: 'I-approve ang login sa iyong ZOREAL ID app.',
    bodyEnrolling: 'Tapusin muna ang pag-set up ng ZOREAL ID sa iyong telepono, pagkatapos ay i-approve ang login.',
    waiting: 'Naghihintay ng scan',
    waitingApproval: 'Naghihintay ng approval',
    expiresIn: 'Mag-e-expire sa {time}',
    secured: 'Proof-of-Human verification mula sa ZOREAL',
    noIdTitle: 'Wala ka pang ZOREAL ID?',
    noIdBody: 'I-scan ang parehong code para i-download ang app at gumawa ng iyong ZOREAL ID nang libre. Isang minuto lang ito.',
    cancel: 'Kanselahin',
    close: 'Isara',
    qrAlt: 'QR code para mag-sign in gamit ang ZOREAL',
    buttonContinue: 'Magpatuloy gamit ang ZOREAL',
  },
  // Türkçe
  tr: {
    title: 'Giriş için tarayın',
    titleIdentify: 'Kimliğinizi doğrulamak için tarayın',
    titlePresence: 'Gerçek bir insan olduğunuzu kanıtlamak için tarayın',
    titleApprove: 'Telefonunuzdan onaylayın',
    bodyScan: 'Telefonunuzun kamerasıyla veya ZOREAL ID uygulamasıyla tarayın.',
    bodyApprove: 'Girişi ZOREAL ID uygulamanızdan onaylayın.',
    bodyEnrolling: 'Telefonunuzda ZOREAL ID kurulumunu tamamlayın, ardından girişi onaylayın.',
    waiting: 'Tarama bekleniyor',
    waitingApproval: 'Onay bekleniyor',
    expiresIn: '{time} içinde sona erer',
    secured: 'ZOREAL tarafından Proof-of-Human doğrulaması',
    noIdTitle: 'Henüz ZOREAL ID\'niz yok mu?',
    noIdBody: 'Uygulamayı indirmek ve ücretsiz bir tane oluşturmak için aynı kodu tarayın. Sadece bir dakikanızı alır.',
    cancel: 'İptal',
    close: 'Kapat',
    qrAlt: 'ZOREAL ile giriş yapmak için QR kodu',
    buttonContinue: 'ZOREAL ile devam et',
  },
  // Українська
  uk: {
    title: 'Скануйте для входу',
    titleIdentify: 'Скануйте, щоб підтвердити особу',
    titlePresence: 'Скануйте, щоб довести, що ви справжня людина',
    titleApprove: 'Підтвердьте на телефоні',
    bodyScan: 'Скануйте камерою телефону або додатком ZOREAL ID.',
    bodyApprove: 'Підтвердьте вхід у додатку ZOREAL ID.',
    bodyEnrolling: 'Завершіть налаштування ZOREAL ID на телефоні, а потім підтвердьте вхід.',
    waiting: 'Очікування сканування',
    waitingApproval: 'Очікування підтвердження',
    expiresIn: 'Спливає через {time}',
    secured: 'Перевірка Proof-of-Human від ZOREAL',
    noIdTitle: 'Ще немає ZOREAL ID?',
    noIdBody: 'Скануйте той самий код, щоб завантажити додаток і безкоштовно створити його. Це займе лише хвилину.',
    cancel: 'Скасувати',
    close: 'Закрити',
    qrAlt: 'QR-код для входу через ZOREAL',
    buttonContinue: 'Продовжити з ZOREAL',
  },
  // اردو
  ur: {
    title: 'لاگ اِن کرنے کے لیے اسکین کریں',
    titleIdentify: 'اپنی شناخت کی تصدیق کے لیے اسکین کریں',
    titlePresence: 'یہ ثابت کرنے کے لیے اسکین کریں کہ آپ ایک حقیقی انسان ہیں',
    titleApprove: 'اپنے فون پر منظوری دیں',
    bodyScan: 'اپنے فون کے کیمرے یا ZOREAL ID ایپ سے اسکین کریں۔',
    bodyApprove: 'اپنی ZOREAL ID ایپ میں لاگ اِن کی منظوری دیں۔',
    bodyEnrolling: 'اپنے فون پر ZOREAL ID کی سیٹ اپ مکمل کریں، پھر لاگ اِن کی منظوری دیں۔',
    waiting: 'اسکین کا انتظار',
    waitingApproval: 'منظوری کا انتظار',
    expiresIn: '{time} میں ختم ہوگا',
    secured: 'ZOREAL کی جانب سے Proof-of-Human تصدیق',
    noIdTitle: 'ابھی تک ZOREAL ID نہیں ہے؟',
    noIdBody: 'ایپ ڈاؤن لوڈ کرنے اور مفت میں ایک بنانے کے لیے وہی کوڈ اسکین کریں۔ اس میں صرف ایک منٹ لگتا ہے۔',
    cancel: 'منسوخ کریں',
    close: 'بند کریں',
    qrAlt: 'ZOREAL کے ساتھ لاگ اِن کرنے کے لیے QR کوڈ',
    buttonContinue: 'ZOREAL کے ساتھ جاری رکھیں',
  },
  // Tiếng Việt
  vi: {
    title: 'Quét để đăng nhập',
    titleIdentify: 'Quét để xác minh danh tính của bạn',
    titlePresence: 'Quét để chứng minh bạn là người thật',
    titleApprove: 'Phê duyệt trên điện thoại của bạn',
    bodyScan: 'Quét bằng camera điện thoại hoặc ứng dụng ZOREAL ID.',
    bodyApprove: 'Phê duyệt đăng nhập trong ứng dụng ZOREAL ID của bạn.',
    bodyEnrolling: 'Hoàn tất thiết lập ZOREAL ID trên điện thoại, sau đó phê duyệt đăng nhập.',
    waiting: 'Đang chờ quét mã',
    waitingApproval: 'Đang chờ phê duyệt',
    expiresIn: 'Hết hạn sau {time}',
    secured: 'Xác minh Proof-of-Human bởi ZOREAL',
    noIdTitle: 'Chưa có ZOREAL ID?',
    noIdBody: 'Quét cùng mã này để tải ứng dụng và tạo tài khoản miễn phí. Chỉ mất một phút.',
    cancel: 'Hủy',
    close: 'Đóng',
    qrAlt: 'Mã QR để đăng nhập bằng ZOREAL',
    buttonContinue: 'Tiếp tục với ZOREAL',
  },
};

/** Locales whose script runs right to left, so the dialog flips with `dir`. */
// Only languages we actually carry. Listing an RTL language we do not
// translate would flip the dialog for someone who is then shown the English
// fallback: LTR text in an RTL container, which is worse than either alone.
const RTL = new Set(['ar', 'he', 'iw', 'ur']);

/**
 * One BCP 47 tag to a translation, or undefined if we do not carry it.
 *
 * Chinese is the only case needing more than the primary subtag: `zh-Hans` /
 * `zh-CN` / `zh-SG` are Simplified, everything else `zh` is treated as
 * Traditional, matching how the pairing page splits them.
 */
/**
 * Primary subtags that reach the same table under another name: superseded ISO
 * codes some platforms still emit, and the written standards we carry one entry
 * for. Without these a Norwegian browser sending `nb` gets English while `no`
 * sits right there in the table.
 */
const ALIASES: Record<string, string> = {
  nb: 'no', // Bokmål, which is what we actually wrote
  nn: 'no', // Nynorsk reader, served Bokmål: closer than English
  fil: 'tl', // Filipino / Tagalog
  iw: 'he', // superseded code for Hebrew, still emitted by some platforms
  in: 'id', // superseded code for Indonesian
};

/**
 * Spanish and Portuguese ship two variants each, and the split that matters is
 * not the language but the side of the Atlantic. A `es-MX` browser resolving to
 * peninsular Spanish is the kind of near-miss that reads as nobody having
 * thought about it, so the Latin American regions are named explicitly.
 */
const LATAM = new Set([
  'ar', 'bo', 'cl', 'co', 'cr', 'cu', 'do', 'ec', 'gt', 'hn',
  'mx', 'ni', 'pa', 'pe', 'pr', 'py', 'sv', 'uy', 've', '419',
]);

function lookup(locale: string): PairingStrings | undefined {
  const tag = locale.toLowerCase().replace(/_/g, '-');
  const parts = tag.split('-');
  const primary = ALIASES[parts[0]] ?? parts[0];
  const region = parts[1];

  // Script, not region, is what separates these two.
  if (primary === 'zh') {
    const simplified = /(^|-)(hans|cn|sg|my)(-|$)/.test(tag);
    return TRANSLATIONS[simplified ? 'zhs' : 'zht'];
  }
  if (primary === 'es' && region && LATAM.has(region)) return TRANSLATIONS['es-419'];
  if (primary === 'pt' && region === 'br') return TRANSLATIONS['pt-br'];

  return TRANSLATIONS[tag] ?? TRANSLATIONS[primary];
}

/**
 * What the phone says the person reads. React Native has no navigator
 * language list; Hermes and JSC both carry Intl, whose default locale is the
 * app's current language as the operating system resolved it (the per-app
 * language on iOS 13+ and Android 13+, else the device's).
 */
function deviceLocales(): string[] {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale;
    return tag ? [tag] : [];
  } catch {
    return [];
  }
}

/**
 * The strings to render.
 *
 * An explicit `locale` (from the provider) wins outright: the host app knows
 * which language it is currently showing, and the modal must not disagree with
 * the page it opened on. With none given we follow the phone's own language, so an
 * integrator who never sets `locale` still gets a translated modal
 * instead of English-by-default. Anything we do not carry falls back to English
 * rather than rendering a key.
 */
export function strings(locale?: string): PairingStrings {
  if (locale) return lookup(locale) ?? en;
  for (const candidate of deviceLocales()) {
    const hit = lookup(candidate);
    if (hit) return hit;
  }
  return en;
}

export function isRtl(locale?: string): boolean {
  const tag = locale ?? deviceLocales()[0];
  if (!tag) return false;
  return RTL.has(tag.toLowerCase().replace(/_/g, '-').split('-')[0]);
}

/** The one substitution the copy needs. */
export function interpolate(template: string, time: string): string {
  return template.replace('{time}', time);
}

/** The copy only the native UI needs, resolved exactly as `strings()` is. */
export interface NativeStrings {
  /** Title while ZOREAL ID on this phone has the request. */
  titleOpen: string;
  bodyOpen: string;
  /** Opens ZOREAL ID again, for someone who came back before approving. */
  reopen: string;
  /** Switches to the QR, for ZOREAL ID on another phone. */
  otherDevice: string;
  /** Switches from the QR back to ZOREAL ID on this phone. */
  thisDevice: string;
  missingTitle: string;
  missingBody: string;
  /** Opens the ZOREAL ID listing in the App Store or Google Play. */
  getApp: string;
  /** Opens the link anyway, for a ZOREAL ID the installed check could not see. */
  haveApp: string;
}

const NATIVE_EN: NativeStrings = {
  titleOpen: 'Continue in ZOREAL ID',
  bodyOpen: 'Approve in ZOREAL ID, then come back to this app.',
  reopen: 'Open ZOREAL ID again',
  otherDevice: 'Use another device',
  thisDevice: 'Open ZOREAL ID on this phone',
  missingTitle: 'ZOREAL ID is not on this phone',
  missingBody: 'Get the ZOREAL ID app to continue, or use ZOREAL ID on another phone.',
  getApp: 'Get ZOREAL ID',
  haveApp: 'I already have ZOREAL ID',
};

/** Keyed as TRANSLATIONS is. A language without an entry reads English. */
const NATIVE: Record<string, Partial<NativeStrings>> = {
  en: NATIVE_EN,
  sv: {
    titleOpen: "Fortsätt i ZOREAL ID",
    bodyOpen: "Godkänn i ZOREAL ID och kom sedan tillbaka till den här appen.",
    reopen: "Öppna ZOREAL ID igen",
    otherDevice: "Använd en annan enhet",
    thisDevice: "Öppna ZOREAL ID på den här telefonen",
    missingTitle: "ZOREAL ID finns inte på den här telefonen",
    missingBody: "Hämta ZOREAL ID-appen för att fortsätta, eller använd ZOREAL ID på en annan telefon.",
    getApp: "Hämta ZOREAL ID",
    haveApp: "Jag har redan ZOREAL ID",
  },
  es: {
    titleOpen: "Continúa en ZOREAL ID",
    bodyOpen: "Apruébalo en ZOREAL ID y luego vuelve a esta app.",
    reopen: "Volver a abrir ZOREAL ID",
    otherDevice: "Usar otro dispositivo",
    thisDevice: "Abrir ZOREAL ID en este teléfono",
    missingTitle: "ZOREAL ID no está en este teléfono",
    missingBody: "Descarga la app ZOREAL ID para continuar o usa ZOREAL ID en otro teléfono.",
    getApp: "Descargar ZOREAL ID",
    haveApp: "Ya tengo ZOREAL ID",
  },
  'es-419': {
    titleOpen: "Continúa en ZOREAL ID",
    bodyOpen: "Aprueba en ZOREAL ID y luego regresa a esta app.",
    reopen: "Volver a abrir ZOREAL ID",
    otherDevice: "Usar otro dispositivo",
    thisDevice: "Abrir ZOREAL ID en este celular",
    missingTitle: "ZOREAL ID no está en este celular",
    missingBody: "Descarga la app ZOREAL ID para continuar o usa ZOREAL ID en otro celular.",
    getApp: "Descargar ZOREAL ID",
    haveApp: "Ya tengo ZOREAL ID",
  },
  pt: {
    titleOpen: "Continue no ZOREAL ID",
    bodyOpen: "Aprove no ZOREAL ID e depois volte a esta app.",
    reopen: "Abrir o ZOREAL ID novamente",
    otherDevice: "Usar outro dispositivo",
    thisDevice: "Abrir o ZOREAL ID neste telefone",
    missingTitle: "O ZOREAL ID não está neste telefone",
    missingBody: "Instale a app ZOREAL ID para continuar ou use o ZOREAL ID noutro telefone.",
    getApp: "Obter o ZOREAL ID",
    haveApp: "Já tenho o ZOREAL ID",
  },
  fr: {
    titleOpen: "Continuez dans ZOREAL ID",
    bodyOpen: "Approuvez dans ZOREAL ID, puis revenez dans cette app.",
    reopen: "Rouvrir ZOREAL ID",
    otherDevice: "Utiliser un autre appareil",
    thisDevice: "Ouvrir ZOREAL ID sur ce téléphone",
    missingTitle: "ZOREAL ID n'est pas installé sur ce téléphone",
    missingBody: "Téléchargez l'app ZOREAL ID pour continuer, ou utilisez ZOREAL ID sur un autre téléphone.",
    getApp: "Télécharger ZOREAL ID",
    haveApp: "J'ai déjà ZOREAL ID",
  },
  de: {
    titleOpen: "In ZOREAL ID fortfahren",
    bodyOpen: "In ZOREAL ID bestätigen und dann zu dieser App zurückkehren.",
    reopen: "ZOREAL ID erneut öffnen",
    otherDevice: "Anderes Gerät verwenden",
    thisDevice: "ZOREAL ID auf diesem Handy öffnen",
    missingTitle: "ZOREAL ID ist auf diesem Handy nicht installiert",
    missingBody: "Zum Fortfahren die ZOREAL ID App laden oder ZOREAL ID auf einem anderen Handy verwenden.",
    getApp: "ZOREAL ID laden",
    haveApp: "Ich habe ZOREAL ID bereits",
  },
  ru: {
    titleOpen: "Продолжите в ZOREAL ID",
    bodyOpen: "Подтвердите в ZOREAL ID, затем вернитесь в это приложение.",
    reopen: "Снова открыть ZOREAL ID",
    otherDevice: "Использовать другое устройство",
    thisDevice: "Открыть ZOREAL ID на этом телефоне",
    missingTitle: "На этом телефоне нет ZOREAL ID",
    missingBody: "Скачайте приложение ZOREAL ID, чтобы продолжить, или используйте ZOREAL ID на другом телефоне.",
    getApp: "Скачать ZOREAL ID",
    haveApp: "У меня уже есть ZOREAL ID",
  },
  ja: {
    titleOpen: "ZOREAL IDで続行",
    bodyOpen: "ZOREAL IDで承認してから、このアプリに戻ってください。",
    reopen: "ZOREAL IDをもう一度開く",
    otherDevice: "別のデバイスを使用",
    thisDevice: "このスマートフォンでZOREAL IDを開く",
    missingTitle: "このスマートフォンにZOREAL IDがありません",
    missingBody: "続行するにはZOREAL IDアプリを入手するか、別のスマートフォンでZOREAL IDを使用してください。",
    getApp: "ZOREAL IDを入手",
    haveApp: "ZOREAL IDをすでにお持ちの方",
  },
  hi: {
    titleOpen: "ZOREAL ID में जारी रखें",
    bodyOpen: "ZOREAL ID में स्वीकृत करें, फिर इस ऐप पर वापस आएं।",
    reopen: "ZOREAL ID फिर से खोलें",
    otherDevice: "दूसरा डिवाइस इस्तेमाल करें",
    thisDevice: "इस फोन पर ZOREAL ID खोलें",
    missingTitle: "इस फोन पर ZOREAL ID नहीं है",
    missingBody: "जारी रखने के लिए ZOREAL ID ऐप डाउनलोड करें, या किसी दूसरे फोन पर ZOREAL ID इस्तेमाल करें।",
    getApp: "ZOREAL ID डाउनलोड करें",
    haveApp: "मेरे पास पहले से ZOREAL ID है",
  },
  zhs: {
    titleOpen: "在 ZOREAL ID 中继续",
    bodyOpen: "请在 ZOREAL ID 中批准，然后返回此应用。",
    reopen: "重新打开 ZOREAL ID",
    otherDevice: "使用其他设备",
    thisDevice: "在此手机上打开 ZOREAL ID",
    missingTitle: "此手机未安装 ZOREAL ID",
    missingBody: "请下载 ZOREAL ID 应用以继续，或在另一部手机上使用 ZOREAL ID。",
    getApp: "获取 ZOREAL ID",
    haveApp: "我已安装 ZOREAL ID",
  },
  zht: {
    titleOpen: "在 ZOREAL ID 中繼續",
    bodyOpen: "請在 ZOREAL ID 中核准，然後返回此應用程式。",
    reopen: "重新開啟 ZOREAL ID",
    otherDevice: "使用其他裝置",
    thisDevice: "在這支手機上開啟 ZOREAL ID",
    missingTitle: "這支手機尚未安裝 ZOREAL ID",
    missingBody: "請下載 ZOREAL ID 應用程式以繼續，或在另一支手機上使用 ZOREAL ID。",
    getApp: "取得 ZOREAL ID",
    haveApp: "我已安裝 ZOREAL ID",
  },
  ar: {
    titleOpen: "تابع في ZOREAL ID",
    bodyOpen: "وافق في ZOREAL ID، ثم عد إلى هذا التطبيق.",
    reopen: "إعادة فتح ZOREAL ID",
    otherDevice: "استخدام جهاز آخر",
    thisDevice: "فتح ZOREAL ID على هذا الهاتف",
    missingTitle: "لا يوجد ZOREAL ID على هذا الهاتف",
    missingBody: "نزّل تطبيق ZOREAL ID للمتابعة، أو استخدم ZOREAL ID على هاتف آخر.",
    getApp: "تنزيل ZOREAL ID",
    haveApp: "لدي ZOREAL ID بالفعل",
  },
  ko: {
    titleOpen: "ZOREAL ID에서 계속",
    bodyOpen: "ZOREAL ID에서 승인한 후 이 앱으로 돌아오세요.",
    reopen: "ZOREAL ID 다시 열기",
    otherDevice: "다른 기기 사용",
    thisDevice: "이 휴대폰에서 ZOREAL ID 열기",
    missingTitle: "이 휴대폰에 ZOREAL ID가 없습니다",
    missingBody: "계속하려면 ZOREAL ID 앱을 설치하거나 다른 휴대폰에서 ZOREAL ID를 사용하세요.",
    getApp: "ZOREAL ID 받기",
    haveApp: "이미 ZOREAL ID가 있습니다",
  },
  bg: {
    titleOpen: "Продължете в ZOREAL ID",
    bodyOpen: "Потвърдете в ZOREAL ID, след което се върнете в това приложение.",
    reopen: "Отвори ZOREAL ID отново",
    otherDevice: "Използвай друго устройство",
    thisDevice: "Отвори ZOREAL ID на този телефон",
    missingTitle: "На този телефон няма ZOREAL ID",
    missingBody: "Изтеглете приложението ZOREAL ID, за да продължите, или използвайте ZOREAL ID на друг телефон.",
    getApp: "Изтегли ZOREAL ID",
    haveApp: "Вече имам ZOREAL ID",
  },
  bn: {
    titleOpen: "ZOREAL ID অ্যাপে চালিয়ে যান",
    bodyOpen: "ZOREAL ID অ্যাপে অনুমোদন করুন, তারপর এই অ্যাপে ফিরে আসুন।",
    reopen: "আবার ZOREAL ID খুলুন",
    otherDevice: "অন্য ডিভাইস ব্যবহার করুন",
    thisDevice: "এই ফোনে ZOREAL ID খুলুন",
    missingTitle: "এই ফোনে ZOREAL ID নেই",
    missingBody: "চালিয়ে যেতে ZOREAL ID অ্যাপটি ডাউনলোড করুন, অথবা অন্য একটি ফোনে ZOREAL ID ব্যবহার করুন।",
    getApp: "ZOREAL ID ডাউনলোড করুন",
    haveApp: "আমার ZOREAL ID আগে থেকেই আছে",
  },
  bs: {
    titleOpen: "Nastavite u ZOREAL ID-u",
    bodyOpen: "Odobrite u ZOREAL ID-u, a zatim se vratite u ovu aplikaciju.",
    reopen: "Ponovo otvori ZOREAL ID",
    otherDevice: "Koristi drugi uređaj",
    thisDevice: "Otvori ZOREAL ID na ovom telefonu",
    missingTitle: "ZOREAL ID nije instaliran na ovom telefonu",
    missingBody: "Preuzmite aplikaciju ZOREAL ID da nastavite ili koristite ZOREAL ID na drugom telefonu.",
    getApp: "Preuzmi ZOREAL ID",
    haveApp: "Već imam ZOREAL ID",
  },
  cs: {
    titleOpen: "Pokračujte v aplikaci ZOREAL ID",
    bodyOpen: "Potvrďte v aplikaci ZOREAL ID a pak se vraťte do této aplikace.",
    reopen: "Znovu otevřít ZOREAL ID",
    otherDevice: "Použít jiné zařízení",
    thisDevice: "Otevřít ZOREAL ID v tomto telefonu",
    missingTitle: "V tomto telefonu není ZOREAL ID",
    missingBody: "Pro pokračování si stáhněte aplikaci ZOREAL ID, nebo použijte ZOREAL ID v jiném telefonu.",
    getApp: "Stáhnout ZOREAL ID",
    haveApp: "ZOREAL ID už mám",
  },
  da: {
    titleOpen: "Fortsæt i ZOREAL ID",
    bodyOpen: "Godkend i ZOREAL ID, og vend derefter tilbage til denne app.",
    reopen: "Åbn ZOREAL ID igen",
    otherDevice: "Brug en anden enhed",
    thisDevice: "Åbn ZOREAL ID på denne telefon",
    missingTitle: "ZOREAL ID er ikke installeret på denne telefon",
    missingBody: "Hent ZOREAL ID-appen for at fortsætte, eller brug ZOREAL ID på en anden telefon.",
    getApp: "Hent ZOREAL ID",
    haveApp: "Jeg har allerede ZOREAL ID",
  },
  el: {
    titleOpen: "Συνέχεια στο ZOREAL ID",
    bodyOpen: "Εγκρίνετε στο ZOREAL ID και μετά επιστρέψτε σε αυτή την εφαρμογή.",
    reopen: "Άνοιγμα ξανά του ZOREAL ID",
    otherDevice: "Χρήση άλλης συσκευής",
    thisDevice: "Άνοιγμα του ZOREAL ID σε αυτό το κινητό",
    missingTitle: "Το ZOREAL ID δεν είναι εγκατεστημένο σε αυτό το κινητό",
    missingBody: "Κατεβάστε την εφαρμογή ZOREAL ID για να συνεχίσετε ή χρησιμοποιήστε το ZOREAL ID σε άλλο κινητό.",
    getApp: "Λήψη του ZOREAL ID",
    haveApp: "Έχω ήδη το ZOREAL ID",
  },
  fi: {
    titleOpen: "Jatka ZOREAL ID -sovelluksessa",
    bodyOpen: "Hyväksy ZOREAL ID -sovelluksessa ja palaa sitten tähän sovellukseen.",
    reopen: "Avaa ZOREAL ID uudelleen",
    otherDevice: "Käytä toista laitetta",
    thisDevice: "Avaa ZOREAL ID tässä puhelimessa",
    missingTitle: "Tässä puhelimessa ei ole ZOREAL ID:tä",
    missingBody: "Jatka lataamalla ZOREAL ID -sovellus tai käytä ZOREAL ID:tä toisessa puhelimessa.",
    getApp: "Lataa ZOREAL ID",
    haveApp: "Minulla on jo ZOREAL ID",
  },
  he: {
    titleOpen: "המשך באפליקציית ZOREAL ID",
    bodyOpen: "אשר באפליקציית ZOREAL ID, ואז חזור לאפליקציה הזו.",
    reopen: "פתח שוב את ZOREAL ID",
    otherDevice: "השתמש במכשיר אחר",
    thisDevice: "פתח את ZOREAL ID בטלפון הזה",
    missingTitle: "אין ZOREAL ID בטלפון הזה",
    missingBody: "הורד את אפליקציית ZOREAL ID כדי להמשיך, או השתמש באפליקציית ZOREAL ID בטלפון אחר.",
    getApp: "הורד את ZOREAL ID",
    haveApp: "כבר יש לי ZOREAL ID",
  },
  hr: {
    titleOpen: "Nastavite u ZOREAL ID-u",
    bodyOpen: "Odobrite u ZOREAL ID-u, a zatim se vratite u ovu aplikaciju.",
    reopen: "Ponovno otvori ZOREAL ID",
    otherDevice: "Koristi drugi uređaj",
    thisDevice: "Otvori ZOREAL ID na ovom mobitelu",
    missingTitle: "ZOREAL ID nije instaliran na ovom mobitelu",
    missingBody: "Preuzmite aplikaciju ZOREAL ID kako biste nastavili ili koristite ZOREAL ID na drugom mobitelu.",
    getApp: "Preuzmi ZOREAL ID",
    haveApp: "Već imam ZOREAL ID",
  },
  hu: {
    titleOpen: "Folytatás a ZOREAL ID alkalmazásban",
    bodyOpen: "Hagyja jóvá a ZOREAL ID alkalmazásban, majd térjen vissza ebbe az alkalmazásba.",
    reopen: "ZOREAL ID újbóli megnyitása",
    otherDevice: "Másik eszköz használata",
    thisDevice: "ZOREAL ID megnyitása ezen a telefonon",
    missingTitle: "Ezen a telefonon nincs ZOREAL ID",
    missingBody: "A folytatáshoz töltse le a ZOREAL ID alkalmazást, vagy használja a ZOREAL ID-t egy másik telefonon.",
    getApp: "ZOREAL ID letöltése",
    haveApp: "Már megvan a ZOREAL ID",
  },
  id: {
    titleOpen: "Lanjutkan di ZOREAL ID",
    bodyOpen: "Setujui di ZOREAL ID, lalu kembali ke aplikasi ini.",
    reopen: "Buka ZOREAL ID lagi",
    otherDevice: "Gunakan perangkat lain",
    thisDevice: "Buka ZOREAL ID di ponsel ini",
    missingTitle: "ZOREAL ID belum terpasang di ponsel ini",
    missingBody: "Unduh aplikasi ZOREAL ID untuk melanjutkan, atau gunakan ZOREAL ID di ponsel lain.",
    getApp: "Unduh ZOREAL ID",
    haveApp: "Saya sudah punya ZOREAL ID",
  },
  it: {
    titleOpen: "Continua nell'app ZOREAL ID",
    bodyOpen: "Approva nell'app ZOREAL ID, poi torna a questa app.",
    reopen: "Riapri ZOREAL ID",
    otherDevice: "Usa un altro dispositivo",
    thisDevice: "Apri ZOREAL ID su questo telefono",
    missingTitle: "ZOREAL ID non è installato su questo telefono",
    missingBody: "Scarica l'app ZOREAL ID per continuare, oppure usa ZOREAL ID su un altro telefono.",
    getApp: "Scarica ZOREAL ID",
    haveApp: "Ho già ZOREAL ID",
  },
  ms: {
    titleOpen: "Teruskan dalam ZOREAL ID",
    bodyOpen: "Luluskan dalam ZOREAL ID, kemudian kembali ke aplikasi ini.",
    reopen: "Buka ZOREAL ID semula",
    otherDevice: "Guna peranti lain",
    thisDevice: "Buka ZOREAL ID di telefon ini",
    missingTitle: "ZOREAL ID belum dipasang di telefon ini",
    missingBody: "Muat turun aplikasi ZOREAL ID untuk meneruskan, atau guna ZOREAL ID di telefon lain.",
    getApp: "Dapatkan ZOREAL ID",
    haveApp: "Saya sudah mempunyai ZOREAL ID",
  },
  nl: {
    titleOpen: "Ga verder in ZOREAL ID",
    bodyOpen: "Keur goed in ZOREAL ID en ga daarna terug naar deze app.",
    reopen: "ZOREAL ID opnieuw openen",
    otherDevice: "Ander apparaat gebruiken",
    thisDevice: "ZOREAL ID openen op deze telefoon",
    missingTitle: "ZOREAL ID staat niet op deze telefoon",
    missingBody: "Download de ZOREAL ID-app om verder te gaan, of gebruik ZOREAL ID op een andere telefoon.",
    getApp: "ZOREAL ID downloaden",
    haveApp: "Ik heb ZOREAL ID al",
  },
  no: {
    titleOpen: "Fortsett i ZOREAL ID",
    bodyOpen: "Godkjenn i ZOREAL ID, og gå deretter tilbake til denne appen.",
    reopen: "Åpne ZOREAL ID igjen",
    otherDevice: "Bruk en annen enhet",
    thisDevice: "Åpne ZOREAL ID på denne telefonen",
    missingTitle: "ZOREAL ID er ikke installert på denne telefonen",
    missingBody: "Last ned ZOREAL ID-appen for å fortsette, eller bruk ZOREAL ID på en annen telefon.",
    getApp: "Last ned ZOREAL ID",
    haveApp: "Jeg har allerede ZOREAL ID",
  },
  pl: {
    titleOpen: "Kontynuuj w aplikacji ZOREAL ID",
    bodyOpen: "Zatwierdź w aplikacji ZOREAL ID, a potem wróć do tej aplikacji.",
    reopen: "Otwórz ponownie ZOREAL ID",
    otherDevice: "Użyj innego urządzenia",
    thisDevice: "Otwórz ZOREAL ID na tym telefonie",
    missingTitle: "Na tym telefonie nie ma ZOREAL ID",
    missingBody: "Pobierz aplikację ZOREAL ID, aby kontynuować, lub użyj ZOREAL ID na innym telefonie.",
    getApp: "Pobierz ZOREAL ID",
    haveApp: "Mam już ZOREAL ID",
  },
  'pt-br': {
    titleOpen: "Continue no ZOREAL ID",
    bodyOpen: "Aprove no ZOREAL ID e depois volte para este app.",
    reopen: "Abrir o ZOREAL ID de novo",
    otherDevice: "Usar outro dispositivo",
    thisDevice: "Abrir o ZOREAL ID neste celular",
    missingTitle: "O ZOREAL ID não está neste celular",
    missingBody: "Baixe o app ZOREAL ID para continuar ou use o ZOREAL ID em outro celular.",
    getApp: "Baixar o ZOREAL ID",
    haveApp: "Já tenho o ZOREAL ID",
  },
  ro: {
    titleOpen: "Continuați în ZOREAL ID",
    bodyOpen: "Aprobați în ZOREAL ID, apoi reveniți în această aplicație.",
    reopen: "Deschideți din nou ZOREAL ID",
    otherDevice: "Folosiți alt dispozitiv",
    thisDevice: "Deschideți ZOREAL ID pe acest telefon",
    missingTitle: "ZOREAL ID nu este instalat pe acest telefon",
    missingBody: "Descărcați aplicația ZOREAL ID pentru a continua sau folosiți ZOREAL ID pe alt telefon.",
    getApp: "Descărcați ZOREAL ID",
    haveApp: "Am deja ZOREAL ID",
  },
  sr: {
    titleOpen: "Наставите у ZOREAL ID-у",
    bodyOpen: "Одобрите у ZOREAL ID-у, па се вратите у ову апликацију.",
    reopen: "Поново отвори ZOREAL ID",
    otherDevice: "Користи други уређај",
    thisDevice: "Отвори ZOREAL ID на овом телефону",
    missingTitle: "ZOREAL ID није инсталиран на овом телефону",
    missingBody: "Преузмите апликацију ZOREAL ID да бисте наставили или користите ZOREAL ID на другом телефону.",
    getApp: "Преузми ZOREAL ID",
    haveApp: "Већ имам ZOREAL ID",
  },
  th: {
    titleOpen: "ดำเนินการต่อใน ZOREAL ID",
    bodyOpen: "อนุมัติใน ZOREAL ID แล้วกลับมาที่แอปนี้",
    reopen: "เปิด ZOREAL ID อีกครั้ง",
    otherDevice: "ใช้อุปกรณ์อื่น",
    thisDevice: "เปิด ZOREAL ID บนโทรศัพท์เครื่องนี้",
    missingTitle: "ไม่มี ZOREAL ID บนโทรศัพท์เครื่องนี้",
    missingBody: "ดาวน์โหลดแอป ZOREAL ID เพื่อดำเนินการต่อ หรือใช้ ZOREAL ID บนโทรศัพท์เครื่องอื่น",
    getApp: "ดาวน์โหลด ZOREAL ID",
    haveApp: "มี ZOREAL ID อยู่แล้ว",
  },
  tl: {
    titleOpen: "Magpatuloy sa ZOREAL ID",
    bodyOpen: "I-approve sa ZOREAL ID, pagkatapos ay bumalik sa app na ito.",
    reopen: "Buksan ulit ang ZOREAL ID",
    otherDevice: "Gumamit ng ibang device",
    thisDevice: "Buksan ang ZOREAL ID sa teleponong ito",
    missingTitle: "Walang ZOREAL ID sa teleponong ito",
    missingBody: "I-download ang ZOREAL ID app para magpatuloy, o gamitin ang ZOREAL ID sa ibang telepono.",
    getApp: "I-download ang ZOREAL ID",
    haveApp: "Mayroon na akong ZOREAL ID",
  },
  tr: {
    titleOpen: "ZOREAL ID uygulamasında devam edin",
    bodyOpen: "ZOREAL ID uygulamasında onaylayın, ardından bu uygulamaya geri dönün.",
    reopen: "ZOREAL ID'yi tekrar aç",
    otherDevice: "Başka bir cihaz kullan",
    thisDevice: "ZOREAL ID'yi bu telefonda aç",
    missingTitle: "ZOREAL ID bu telefonda yüklü değil",
    missingBody: "Devam etmek için ZOREAL ID uygulamasını indirin veya ZOREAL ID'yi başka bir telefonda kullanın.",
    getApp: "ZOREAL ID'yi indir",
    haveApp: "ZOREAL ID'm zaten var",
  },
  uk: {
    titleOpen: "Продовжте в ZOREAL ID",
    bodyOpen: "Підтвердьте в ZOREAL ID, а потім поверніться до цього додатка.",
    reopen: "Знову відкрити ZOREAL ID",
    otherDevice: "Використати інший пристрій",
    thisDevice: "Відкрити ZOREAL ID на цьому телефоні",
    missingTitle: "На цьому телефоні немає ZOREAL ID",
    missingBody: "Завантажте додаток ZOREAL ID, щоб продовжити, або скористайтеся ZOREAL ID на іншому телефоні.",
    getApp: "Завантажити ZOREAL ID",
    haveApp: "У мене вже є ZOREAL ID",
  },
  ur: {
    titleOpen: "ZOREAL ID میں جاری رکھیں",
    bodyOpen: "ZOREAL ID میں منظوری دیں، پھر اس ایپ پر واپس آئیں۔",
    reopen: "ZOREAL ID دوبارہ کھولیں",
    otherDevice: "دوسرا ڈیوائس استعمال کریں",
    thisDevice: "اس فون پر ZOREAL ID کھولیں",
    missingTitle: "اس فون پر ZOREAL ID موجود نہیں ہے",
    missingBody: "جاری رکھنے کے لیے ZOREAL ID ایپ ڈاؤن لوڈ کریں، یا کسی دوسرے فون پر ZOREAL ID استعمال کریں۔",
    getApp: "ZOREAL ID ڈاؤن لوڈ کریں",
    haveApp: "میرے پاس پہلے سے ZOREAL ID ہے",
  },
  vi: {
    titleOpen: "Tiếp tục trong ZOREAL ID",
    bodyOpen: "Phê duyệt trong ZOREAL ID, sau đó quay lại ứng dụng này.",
    reopen: "Mở lại ZOREAL ID",
    otherDevice: "Dùng thiết bị khác",
    thisDevice: "Mở ZOREAL ID trên điện thoại này",
    missingTitle: "Điện thoại này chưa có ZOREAL ID",
    missingBody: "Tải ứng dụng ZOREAL ID để tiếp tục, hoặc dùng ZOREAL ID trên điện thoại khác.",
    getApp: "Tải ZOREAL ID",
    haveApp: "Tôi đã có ZOREAL ID",
  },
};

export function nativeStrings(locale?: string): NativeStrings {
  const table = strings(locale);
  const key = Object.keys(TRANSLATIONS).find((k) => TRANSLATIONS[k] === table) ?? 'en';
  return { ...NATIVE_EN, ...NATIVE[key] };
}
