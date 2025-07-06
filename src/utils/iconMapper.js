// iconMapper.js
import QuizIcon from "@mui/icons-material/Quiz";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PollIcon from "@mui/icons-material/Poll";
import ForumIcon from "@mui/icons-material/Forum";
import ImageIcon from "@mui/icons-material/Image";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // fallback

const iconMap = {
  quiz: QuizIcon,
  sports_esports: SportsEsportsIcon,
  poll: PollIcon,
  forum: ForumIcon,
  image: ImageIcon,
  assignment: AssignmentIcon,
  how_to_reg: HowToRegIcon,
  emoji_events: EmojiEventsIcon,
};

export function getModuleIcon(iconKey) {
  const IconComponent = iconMap[iconKey] || HelpOutlineIcon;
  return <IconComponent />;
}
