// General UI / Navigation Icons
import {
  Home as HomeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Save as SaveIcon,
  Start as StartIcon,
  Stop as StopIcon,
  Stop as ResumeIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  FilterAlt as FilterIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Replay as ReplayIcon,
  Leaderboard as LeaderboardIcon,
  ViewModule as ModuleIcon,
  Menu as MenuIcon,
  Fullscreen as FullscreenIcon,
  Assignment as FormIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Language as LanguageIcon,
  RestoreFromTrash as RestoreIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";

// Social Media Icons
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";

// Outlined / extras we need across pages
import {
  PersonOutline as PersonOutlineIcon,
  EmailOutlined as EmailOutlinedIcon,
  ApartmentOutlined as ApartmentOutlinedIcon,
  QueryBuilderOutlined as QueryBuilderOutlinedIcon,
  VpnKeyOutlined as VpnKeyOutlinedIcon,
  VerifiedOutlined as VerifiedOutlinedIcon,
  AssignmentOutlined as AssignmentOutlinedIcon,
  EventOutlined as EventOutlinedIcon,
} from "@mui/icons-material";

// Status & Feedback
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from "@mui/icons-material";

// Authentication Icons
import {
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
} from "@mui/icons-material";

// File Actions
import {
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from "@mui/icons-material";

// Time & Location
import {
  LocationOn as LocationIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  TableRestaurant as TableRestaurantIcon,
} from "@mui/icons-material";

// Domain-Specific / App Functionality
import {
  AppRegistration as AppRegistrationIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  PeopleAlt as PeopleAltIcon,
  Quiz as QuizIcon,
  Poll as PollIcon,
  ContentCopy as ContentCopyIcon,
  EmojiEvents as EmojiEventsIcon,
  SportsEsports as SportsEsportsIcon,
  Image as ImageIcon,
  Assignment as AssignmentIcon,
  HowToReg as HowToRegIcon,
  QrCode as QrCodeIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  FlashOn as FlashOnIcon,
  Print as PrintIcon,
  Key as KeyIcon
} from "@mui/icons-material";

// Screen Sharing
import {
  ScreenShare as ScreenShareIcon,
  DesktopWindows as DesktopWindowsIcon,
  Devices as DevicesIcon,
  Monitor as MonitorIcon,
  Tv as TvIcon,
  SmartDisplay as SmartDisplayIcon,
  TabletMac as TabletMacIcon,
  Laptop as LaptopIcon,
  PhoneAndroid as PhoneAndroidIcon,
  PhoneIphone as PhoneIphoneIcon,
  Cast as CastIcon,
  ConnectedTv as ConnectedTvIcon,
  DeveloperBoard as DeveloperBoardIcon,
  SettingsInputHdmi as SettingsInputHdmiIcon,
  SettingsInputComponent as SettingsInputComponentIcon,
} from "@mui/icons-material";

// Miscellaneous Icons
import {
  People as PeopleIcon,
  Forum as ForumIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOffAlt as ThumbUpOffAltIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  SearchOff as EmptyIcon,
  Wallpaper as WallpaperIcon,
  Clear as ClearIcon,
  PhotoLibrary as PhotoLibraryIcon,
  CameraAlt as CameraIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Help as HelpIcon,
  Group as GroupIcon,
  Description as DescriptionIcon,
  MeetingRoom as DoorIcon,
  Desk as DeskIcon,
  Insights as InsightsIcon
} from "@mui/icons-material";

const ICONS = {
  // General UI / Navigation
  star: StarIcon,
  starBorder: StarBorderIcon,
  form: FormIcon,
  home: HomeIcon,
  add: AddIcon,
  create: AddIcon,
  edit: EditIcon,
  delete: DeleteIcon,
  share: ShareIcon,
  close: CloseIcon,
  cancel: CancelIcon,
  start: StartIcon,
  stop: StopIcon,
  play: PlayArrowIcon,
  pause: PauseIcon,
  resume: ResumeIcon,
  history: HistoryIcon,
  settings: SettingsIcon,
  filter: FilterIcon,
  check: CheckIcon,
  save: SaveIcon,
  back: ArrowBackIcon,
  next: ArrowForwardIcon,
  view: VisibilityIcon,
  hide: VisibilityOffIcon,
  search: SearchIcon,
  replay: ReplayIcon,
  leaderboard: LeaderboardIcon,
  results: LeaderboardIcon,
  module: ModuleIcon,
  menu: MenuIcon,
  fullscreen: FullscreenIcon,
  Language: LanguageIcon,
  restore: RestoreIcon,
  badge: BadgeIcon,
  door: DoorIcon,
  desk: DeskIcon,
  // Social Media
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  twitter: TwitterIcon,
  whatsapp: WhatsAppIcon,

  // Outlined / extras
  personOutline: PersonOutlineIcon,
  emailOutline: EmailOutlinedIcon,
  apartment: ApartmentOutlinedIcon,
  timeOutline: QueryBuilderOutlinedIcon,
  vpnKey: VpnKeyOutlinedIcon,
  verified: VerifiedOutlinedIcon,
  assignmentOutline: AssignmentOutlinedIcon,
  eventOutline: EventOutlinedIcon,

  // Auth
  login: LoginIcon,
  logout: LogoutIcon,
  register: RegisterIcon,

  // File Actions
  download: FileDownloadIcon,
  upload: FileUploadIcon,
  pdf: PictureAsPdfIcon,

  // Status & Feedback
  info: InfoIcon,
  warning: WarningIcon,
  errorOutline: ErrorOutlineIcon,
  checkCircle: CheckCircleIcon,
  checkCircleOutline: CheckCircleOutlineIcon,

  // Time & Location
  location: LocationIcon,
  event: EventIcon,
  time: AccessTimeIcon,
  diningTable: TableRestaurantIcon,

  // Domain-Specific / App Features
  appRegister: AppRegistrationIcon,
  qrCodeScanner: QrCodeScannerIcon,
  business: BusinessIcon,
  person: PersonIcon,
  peopleAlt: PeopleAltIcon,
  quiz: QuizIcon,
  poll: PollIcon,
  copy: ContentCopyIcon,
  trophy: EmojiEventsIcon,
  games: SportsEsportsIcon,
  image: ImageIcon,
  assignment: AssignmentIcon,
  checkin: HowToRegIcon,
  qrcode: QrCodeIcon,
  screenShare: ScreenShareIcon,
  adminPanel: AdminPanelSettingsIcon,
  flash: FlashOnIcon,
  print: PrintIcon,
  key: KeyIcon,

  // Screen Sharing / Device Icons
  desktop: DesktopWindowsIcon,
  devices: DevicesIcon,
  monitor: MonitorIcon,
  tv: TvIcon,
  smartDisplay: SmartDisplayIcon,
  tablet: TabletMacIcon,
  laptop: LaptopIcon,
  phoneAndroid: PhoneAndroidIcon,
  phoneIphone: PhoneIphoneIcon,
  cast: CastIcon,
  connectedTv: ConnectedTvIcon,
  developerBoard: DeveloperBoardIcon,
  settingsInputHdmi: SettingsInputHdmiIcon,
  settingsInputComponent: SettingsInputComponentIcon,

  // Miscellaneous
  people: PeopleIcon,
  forum: ForumIcon,
  thumb: ThumbUpIcon,
  thumbOff: ThumbUpOffAltIcon,
  phone: PhoneIcon,
  email: EmailIcon,
  empty: EmptyIcon,
  wallpaper: WallpaperIcon,
  clear: ClearIcon,
  library: PhotoLibraryIcon,
  camera: CameraIcon,
  refresh: RefreshIcon,
  send: SendIcon,
  help: HelpIcon,
  group: GroupIcon,
  description: DescriptionIcon,
  insights: InsightsIcon,
};

export default ICONS;
