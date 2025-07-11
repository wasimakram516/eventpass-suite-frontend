import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Replay as ReplayIcon,
  Leaderboard as LeaderboardIcon,
} from "@mui/icons-material";

import {
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
} from "@mui/icons-material";

import {
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
} from "@mui/icons-material";

import {
  LocationOn as LocationIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  TableRestaurant as TableRestaurantIcon,
  AppRegistration as AppRegistrationIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Quiz as QuizIcon,
} from "@mui/icons-material";

import PollIcon from "@mui/icons-material/Poll";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
const ICONS = {
  // General Actions
  add: AddIcon,
  create: AddIcon,
  edit: EditIcon,
  delete: DeleteIcon,
  share: ShareIcon,
  close: CloseIcon,
  cancel: CancelIcon,
  check: CheckIcon,
  save: SaveIcon,
  back: ArrowBackIcon,
  next: ArrowForwardIcon,
  view: VisibilityIcon,
  hide: VisibilityOffIcon,
  search: SearchIcon,
  replay: ReplayIcon,
  results: LeaderboardIcon,
  leaderboard: LeaderboardIcon,

  // Auth
  login: LoginIcon,
  logout: LogoutIcon,
  register: RegisterIcon,

  // File Actions
  download: FileDownloadIcon,
  upload: FileUploadIcon,

  // Info & Status
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

  // Domain-specific
  appRegister: AppRegistrationIcon,
  qrCodeScanner: QrCodeScannerIcon,
  business: BusinessIcon,
  person: PersonIcon,
  quiz: QuizIcon,
  checkCircle: CheckCircleIcon,
  poll: PollIcon,
  copy: ContentCopyIcon,
};

export default ICONS;
