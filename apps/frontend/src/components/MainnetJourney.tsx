import {Link} from 'react-router-dom'
import {useI18n} from '../i18n/I18nContext'
import type {Lang} from '../i18n/types'
import {useWallet} from '../context/WalletContext'
import {requestOpenConnect} from '../lib/walletEvents'
import Icon from '../experience/Icon'
import './MainnetJourney.css'

export type JourneyPage='home'|'market'|'studio'

type JourneyCopy={
  title:string;subtitle:string;network:string;steps:[string,string,string];
  descriptions:[string,string,string];connect:string;account:string;signing:string;
  readonly:string;explorer:string;footnote:string;stepsLabel:string
}

/**
 * UX guidance only. Mainnet transaction capabilities remain in the existing
 * wallet SDK and canListBuyNft/canBuyAgent runtime verification gates.
 * This component never creates, signs, sends or broadcasts a transaction.
 */
const COPY:Record<Lang,JourneyCopy>={
 fr:{title:'Votre parcours dans xArtists',subtitle:'Découvrez une œuvre, explorez le marché ou créez votre NFT avec votre propre portefeuille.',network:'MultiversX · mainnet',steps:['Accueil','Marketplace','Studio'],descriptions:['Comprendre et découvrir','Explorer les œuvres','Créer et signer'],connect:'Connecter xPortal',account:'Mon portefeuille',signing:'Session xPortal connectée',readonly:'Compte affiché · signature à vérifier',explorer:'Vérifier sur Explorer',footnote:'Chaque transaction réelle reste soumise à votre signature, aux rôles on-chain et aux vérifications du contrat concerné.',stepsLabel:'Parcours principal xArtists'},
 en:{title:'Your xArtists journey',subtitle:'Discover art, explore the marketplace, or create an NFT with your own wallet.',network:'MultiversX · mainnet',steps:['Home','Marketplace','Studio'],descriptions:['Discover and understand','Explore artwork','Create and sign'],connect:'Connect xPortal',account:'My wallet',signing:'xPortal session connected',readonly:'Account shown · verify before signing',explorer:'Check Explorer',footnote:'Each real transaction still requires your signature, on-chain roles, and the relevant contract checks.',stepsLabel:'Main xArtists journey'},
 es:{title:'Tu recorrido en xArtists',subtitle:'Descubre obras, explora el mercado o crea un NFT con tu cartera.',network:'MultiversX · mainnet',steps:['Inicio','Mercado','Estudio'],descriptions:['Descubrir y comprender','Explorar obras','Crear y firmar'],connect:'Conectar xPortal',account:'Mi cartera',signing:'Sesión xPortal conectada',readonly:'Cuenta visible · verificar firma',explorer:'Ver en Explorer',footnote:'Cada transacción real requiere tu firma, los roles on-chain y las verificaciones del contrato.',stepsLabel:'Recorrido principal xArtists'},
 de:{title:'Dein Weg durch xArtists',subtitle:'Kunst entdecken, den Marktplatz erkunden oder ein NFT mit deiner Wallet erstellen.',network:'MultiversX · Mainnet',steps:['Start','Marktplatz','Studio'],descriptions:['Entdecken und verstehen','Werke erkunden','Erstellen und signieren'],connect:'xPortal verbinden',account:'Meine Wallet',signing:'xPortal-Sitzung verbunden',readonly:'Konto sichtbar · Signatur prüfen',explorer:'Im Explorer prüfen',footnote:'Jede echte Transaktion erfordert deine Signatur, On-Chain-Rollen und eine geprüfte Vertragsfreigabe.',stepsLabel:'xArtists-Hauptnavigation'},
 ru:{title:'Ваш путь в xArtists',subtitle:'Изучайте искусство, рынок или создавайте NFT через свой кошелёк.',network:'MultiversX · mainnet',steps:['Главная','Маркетплейс','Студия'],descriptions:['Узнать о проекте','Посмотреть работы','Создать и подписать'],connect:'Подключить xPortal',account:'Мой кошелёк',signing:'Сессия xPortal подключена',readonly:'Адрес виден · проверяйте подпись',explorer:'Проверить в Explorer',footnote:'Реальные транзакции требуют вашей подписи, разрешений в сети и проверки контракта.',stepsLabel:'Основной путь xArtists'},
 uk:{title:'Ваш шлях у xArtists',subtitle:'Знайомтеся з мистецтвом, ринком або створюйте NFT зі своїм гаманцем.',network:'MultiversX · mainnet',steps:['Головна','Маркет','Студія'],descriptions:['Дізнатися більше','Переглянути твори','Створити й підписати'],connect:'Підключити xPortal',account:'Мій гаманець',signing:'Сесію xPortal підключено',readonly:'Адресу показано · перевірте підпис',explorer:'Перевірити в Explorer',footnote:'Реальні транзакції потребують вашого підпису, дозволів у мережі та перевірки контракту.',stepsLabel:'Основний маршрут xArtists'},
 zh:{title:'探索 xArtists',subtitle:'发现艺术、浏览市场，或使用自己的钱包创建 NFT。',network:'MultiversX · 主网',steps:['首页','市场','工作室'],descriptions:['了解平台','浏览艺术品','创建并签名'],connect:'连接 xPortal',account:'我的钱包',signing:'xPortal 会话已连接',readonly:'已显示账户 · 签名前核实',explorer:'在 Explorer 中检查',footnote:'每笔真实交易均须用户签名、链上权限及相关合约验证。',stepsLabel:'xArtists 主导航'},
 ar:{title:'رحلتك في xArtists',subtitle:'اكتشف الفن أو تصفح السوق أو أنشئ NFT بمحفظتك الخاصة.',network:'MultiversX · الشبكة الرئيسية',steps:['الرئيسية','السوق','الاستوديو'],descriptions:['اكتشف المنصة','استكشف الأعمال','أنشئ ووقّع'],connect:'ربط xPortal',account:'محفظتي',signing:'جلسة xPortal متصلة',readonly:'الحساب معروض · تحقق قبل التوقيع',explorer:'التحقق في Explorer',footnote:'تتطلب كل معاملة حقيقية توقيعك وأذونات السلسلة والتحقق من العقد المعني.',stepsLabel:'المسار الرئيسي في xArtists'},
}
const ITEMS=[
 {id:'home',to:'/',icon:'orb'},
 {id:'market',to:'/marketplace',icon:'market'},
 {id:'studio',to:'/studio',icon:'create'},
] as const

export default function MainnetJourney({current}:{current:JourneyPage}){
 const {lang}=useI18n()
 const copy=COPY[lang]||COPY.en
 const {connected,method,sessionLive}=useWallet()
 const xportalLive=connected&&method==='xportal'&&sessionLive===true
 return <section className="xa-mainnet-journey" aria-labelledby={'xa-journey-title-'+current}
    data-mainnet-journey={current}>
   <header className="xa-mainnet-journey-heading">
     <div>
       <p className="xa-mainnet-journey-network"><span aria-hidden="true"/> {copy.network} · chainID 1</p>
       <h2 id={'xa-journey-title-'+current}>{copy.title}</h2>
       <p>{copy.subtitle}</p>
     </div>
   </header>
   <nav aria-label={copy.stepsLabel}>
     <ol className="xa-mainnet-journey-steps">
       {ITEMS.map((item,index)=><li key={item.id}>
         <Link to={item.to} className={'xa-mainnet-journey-link'+(current===item.id?' is-current':'')}
           aria-current={current===item.id?'step':undefined}>
           <span className="xa-mainnet-journey-symbol"><Icon name={item.icon} size={21}/></span>
           <span className="xa-mainnet-journey-step-copy">
             <span className="xa-mainnet-journey-number">{String(index+1).padStart(2,'0')}</span>
             <strong>{copy.steps[index]}</strong>
             <small>{copy.descriptions[index]}</small>
           </span>
           <Icon name="arrow" size={17}/>
         </Link>
       </li>)}
     </ol>
   </nav>
   <div className="xa-mainnet-journey-footer">
     <p>{copy.footnote}</p>
     <div className="xa-mainnet-journey-actions">
       {connected
        ? <><span className="xa-mainnet-journey-wallet" role="status">
             {xportalLive?copy.signing:copy.readonly}
           </span><Link to="/wallet" className="xa-mainnet-journey-tool">
             <Icon name="wallet" size={16}/>{copy.account}
           </Link></>
        : <button type="button" onClick={requestOpenConnect} className="xa-mainnet-journey-tool">
            <Icon name="wallet" size={16}/>{copy.connect}
          </button>}
       <a href="https://explorer.multiversx.com/" target="_blank"
          rel="noopener noreferrer" className="xa-mainnet-journey-tool">
         <Icon name="globe" size={16}/>{copy.explorer}
       </a>
     </div>
   </div>
 </section>
}
