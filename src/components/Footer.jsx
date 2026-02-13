import React from 'react';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import moment from 'moment';
import './Footer.css';

const Footer = ({ lastUpdated }) => {
  return (
    <footer className="footer">
    <div className="footer-content">
    <div className="footer-info">
    <p>🔍 Tender Scraper Dashboard</p>
    <p className="update-time">
    Last updated: {moment(lastUpdated).format('MMMM Do YYYY, h:mm:ss A')}
    </p>
    </div>
    <div className="footer-links">
    <a href="#" target="_blank" rel="noopener noreferrer">
    <FaGithub />
    </a>
    <a href="#" target="_blank" rel="noopener noreferrer">
    <FaTwitter />
    </a>
    <a href="#" target="_blank" rel="noopener noreferrer">
    <FaLinkedin />
    </a>
    </div>
    </div>
    <div className="footer-bottom">
    <p>© 2024 Tender Scraper Dashboard. All rights reserved.</p>
    </div>
    </footer>
  );
};

export default Footer;
