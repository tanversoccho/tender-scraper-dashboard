import React from 'react';
import { FaPowerOff, FaCode, FaClock } from 'react-icons/fa';
import './PowerShellHeader.css';

const PowerShellHeader = ({ loadTime }) => {
  return (
    <div className="ps-header">
    <div className="ps-header-left">
    <FaPowerOff className="ps-icon" />
    <span className="ps-version">PowerShell 7.5.4</span>
    </div>
    <div className="ps-path">
    <FaCode className="ps-icon-small" />
     Acer@laptop E:\..\extra  master
    </div>
    <div className="load-time">
    <FaClock className="ps-icon-small" />
    Loading personal and system profiles took {loadTime}
    </div>
    </div>
  );
};

export default PowerShellHeader;
