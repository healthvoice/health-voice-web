import { cn } from "@/utils/cn";
import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {}

export const AnalyticsIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      opacity="0.4"
      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 9.20261 3.14864 6.67349 5 4.85857"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.7"
      d="M5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const ChatBusinessIcon: React.FC<IconProps> = ({
  className,
  ...props
}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M8.03339 3.65784C8.37932 2.78072 9.62068 2.78072 9.96661 3.65785L11.0386 6.37599C11.1442 6.64378 11.3562 6.85576 11.624 6.96137L14.3422 8.03339C15.2193 8.37932 15.2193 9.62068 14.3422 9.96661L11.624 11.0386C11.3562 11.1442 11.1442 11.3562 11.0386 11.624L9.96661 14.3422C9.62067 15.2193 8.37932 15.2193 8.03339 14.3422L6.96137 11.624C6.85575 11.3562 6.64378 11.1442 6.37599 11.0386L3.65784 9.96661C2.78072 9.62067 2.78072 8.37932 3.65785 8.03339L6.37599 6.96137C6.64378 6.85575 6.85576 6.64378 6.96137 6.37599L8.03339 3.65784Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.4"
      d="M16.4885 13.3481C16.6715 12.884 17.3285 12.884 17.5115 13.3481L18.3121 15.3781C18.368 15.5198 18.4802 15.632 18.6219 15.6879L20.6519 16.4885C21.116 16.6715 21.116 17.3285 20.6519 17.5115L18.6219 18.3121C18.4802 18.368 18.368 18.4802 18.3121 18.6219L17.5115 20.6519C17.3285 21.116 16.6715 21.116 16.4885 20.6519L15.6879 18.6219C15.632 18.4802 15.5198 18.368 15.3781 18.3121L13.3481 17.5115C12.884 17.3285 12.884 16.6715 13.3481 16.4885L15.3781 15.6879C15.5198 15.632 15.632 15.5198 15.6879 15.3781L16.4885 13.3481Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const ChatIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <circle
      cx="3"
      cy="3"
      r="3"
      transform="matrix(-1 0 0 1 22 2)"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M14 2.20004C13.3538 2.06886 12.6849 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const ContactsIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <circle cx="9" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path
      opacity="0.5"
      d="M12.5 4.3411C13.0375 3.53275 13.9565 3 15 3C16.6569 3 18 4.34315 18 6C18 7.65685 16.6569 9 15 9C13.9565 9 13.0375 8.46725 12.5 7.6589"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <ellipse
      cx="9"
      cy="17"
      rx="7"
      ry="4"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M18 14C19.7542 14.3847 21 15.3589 21 16.5C21 17.5293 19.9863 18.4229 18.5 18.8704"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const GeneralVisionIcon: React.FC<IconProps> = ({
  className,
  ...props
}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M22 12C22 12 21.0071 12.8907 19.0212 13.6851L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L4.97883 13.6851C2.99294 12.8907 2 12 2 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M22 16C22 16 21.0071 16.8907 19.0212 17.6851L16.2127 18.8085C14.2268 19.6028 13.2339 20 12 20C10.7661 20 9.77318 19.6028 7.7873 18.8085L4.97883 17.6851C2.99294 16.8907 2 16 2 16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      opacity="0.5"
      d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M15 18H9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const LastRecordIcon: React.FC<IconProps> = ({
  className,
  ...props
}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V8Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M11 8H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M10 11L14 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M20 10V11C20 15.4183 16.4183 19 12 19M4 10V11C4 15.4183 7.58172 19 12 19M12 19V22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const NotesIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M20.3116 12.6473L20.8293 10.7154C21.4335 8.46034 21.7356 7.3328 21.5081 6.35703C21.3285 5.58657 20.9244 4.88668 20.347 4.34587C19.6157 3.66095 18.4881 3.35883 16.2331 2.75458C13.978 2.15033 12.8504 1.84821 11.8747 2.07573C11.1042 2.25537 10.4043 2.65945 9.86351 3.23687C9.27709 3.86298 8.97128 4.77957 8.51621 6.44561C8.43979 6.7254 8.35915 7.02633 8.27227 7.35057L8.27222 7.35077L7.75458 9.28263C7.15033 11.5377 6.84821 12.6652 7.07573 13.641C7.25537 14.4115 7.65945 15.1114 8.23687 15.6522C8.96815 16.3371 10.0957 16.6392 12.3508 17.2435L12.3508 17.2435C14.3834 17.7881 15.4999 18.0873 16.415 17.9744C16.5152 17.9621 16.6129 17.9448 16.7092 17.9223C17.4796 17.7427 18.1795 17.3386 18.7203 16.7612C19.4052 16.0299 19.7074 14.9024 20.3116 12.6473Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M16.415 17.9741C16.2065 18.6126 15.8399 19.1902 15.347 19.6519C14.6157 20.3368 13.4881 20.6389 11.2331 21.2432C8.97798 21.8474 7.85044 22.1495 6.87466 21.922C6.10421 21.7424 5.40432 21.3383 4.86351 20.7609C4.17859 20.0296 3.87647 18.9021 3.27222 16.647L2.75458 14.7151C2.15033 12.46 1.84821 11.3325 2.07573 10.3567C2.25537 9.58627 2.65945 8.88638 3.23687 8.34557C3.96815 7.66065 5.09569 7.35853 7.35077 6.75428C7.77741 6.63996 8.16368 6.53646 8.51621 6.44531"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M11.7769 10L16.6065 11.2941"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M11 12.8975L13.8978 13.6739"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const OtherIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      opacity="0.5"
      d="M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 12H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 8H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 16H13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const StudyIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M3.09155 6.63659L9.78267 3.49965C11.2037 2.83345 12.7961 2.83345 14.2171 3.49965L20.9083 6.63664C22.3638 7.31899 22.3638 9.68105 20.9083 10.3634L14.2172 13.5003C12.7962 14.1665 11.2038 14.1665 9.78275 13.5003L4.99995 11.2581"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M2.5 15V12.1376C2.5 10.8584 2.5 10.2188 2.83032 9.71781C3.16064 9.21687 3.74853 8.96492 4.92432 8.461L6 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      opacity="0.5"
      d="M19 11.5V16.6254C19 17.6334 18.4965 18.5772 17.6147 19.0656C16.1463 19.8787 13.796 21 12 21C10.204 21 7.8537 19.8787 6.38533 19.0656C5.5035 18.5772 5 17.6334 5 16.6254V11.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const TranscriptionIcon: React.FC<IconProps> = ({
  className,
  ...props
}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M12 4L12 20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M16 7L16 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M8 7L8 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M20 11L20 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4 11L4 13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
    <path
      opacity="0.5"
      d="M4 21V17C4 15.3431 5.34315 14 7 14H17C18.6569 14 20 15.3431 20 17V21"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M19.4 15.0001C20.3 14.7001 21.1 13.5001 21.1 12.0001C21.1 10.5001 20.3 9.3001 19.4 9.0001C19.8 8.3001 20 7.5001 20 6.6001C20 4.6001 18.4 3.0001 16.4 3.0001C15.5 3.0001 14.7 3.2001 14 3.6001C13.7 2.7001 12.5 1.9001 11 1.9001C9.5 1.9001 8.3 2.7001 8 3.6001C7.3 3.2001 6.5 3.0001 5.6 3.0001C3.6 3.0001 2 4.6001 2 6.6001C2 7.5001 2.2 8.3001 2.6 9.0001C1.7 9.3001 0.9 10.5001 0.9 12.0001C0.9 13.5001 1.7 14.7001 2.6 15.0001C2.2 15.7001 2 16.5001 2 17.4001C2 19.4001 3.6 21.0001 5.6 21.0001C6.5 21.0001 7.3 20.8001 8 20.4001C8.3 21.3001 9.5 22.1001 11 22.1001C12.5 22.1001 13.7 21.3001 14 20.4001C14.7 20.8001 15.5 21.0001 16.4 21.0001C18.4 21.0001 20 19.4001 20 17.4001C20 16.5001 19.8 15.7001 19.4 15.0001Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M2 12H5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M19 12H22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 2V5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 19V22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SmartphoneIcon: React.FC<IconProps> = ({
  className,
  ...props
}) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <rect
      x="5"
      y="2"
      width="14"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M12 18H12.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const SupportIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M7.75697 6.13651C8.68525 5.58913 9.40698 4.79374 9.94411 3.86314C10.5098 2.88334 11.026 2.36709 11.9996 2.36709C12.9732 2.36709 13.4895 2.88334 14.0551 3.86314C14.5922 4.79374 15.314 5.58913 16.2423 6.13651C17.2289 6.7183 17.7503 6.96989 17.7503 7.95427C17.7503 8.93864 17.2289 9.19024 16.2423 9.77203C15.314 10.3194 14.5922 11.1148 14.0551 12.0454C13.4895 13.0252 12.9732 13.5414 11.9996 13.5414C11.026 13.5414 10.5098 13.0252 9.94411 12.0454C9.40698 11.1148 8.68525 10.3194 7.75697 9.77203C6.77038 9.19023 6.24898 8.93864 6.24898 7.95427C6.24898 6.96989 6.77038 6.7183 7.75697 6.13651Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      opacity="0.5"
      d="M21 16C21 18.7614 18.7614 21 16 21C14.8519 21 13.794 20.6133 12.9372 19.9614C12.6563 19.7476 12.5159 19.6407 12.3598 19.601C12.2038 19.5613 11.979 19.6026 11.5295 19.6853L10.0588 19.9559C9.17647 20.1182 8.35294 19.3497 8.44118 18.4905L8.60146 16.9298C8.61803 16.7685 8.62632 16.6879 8.61395 16.6138C8.60158 16.5398 8.56686 16.4704 8.49742 16.3315C7.94056 15.2178 7.96263 13.881 8.59853 12.7843C9.09804 11.9221 9.87582 11.365 10.7484 11.0601"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      opacity="0.5"
      d="M5 2.5C3.34315 2.5 2 3.84315 2 5.5C2 7.15685 3.34315 8.5 5 8.5C6.65685 8.5 8 7.15685 8 5.5C8 3.84315 6.65685 2.5 5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-4 w-4", className)}
    {...props}
  >
    <path
      d="M15 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 12L16 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 12L12 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 12L12 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
