"""SQLAlchemy database models for Sentinel One Lite."""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Host(Base):
    """Host information model."""
    
    __tablename__ = 'hosts'
    
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), nullable=False, index=True)
    platform = Column(String(100), nullable=False)
    os_version = Column(String(255), nullable=False)
    last_seen = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    events = relationship('Event', back_populates='host')
    alerts = relationship('Alert', back_populates='host')
    
    def __repr__(self):
        return f'<Host(hostname={self.hostname}, platform={self.platform})>'


class Event(Base):
    """Security event model."""
    
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey('hosts.id'), nullable=False, index=True)
    event_time = Column(DateTime, nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(50), nullable=False)
    
    # Process-related fields
    proc_name = Column(String(255), nullable=True, index=True)
    proc_pid = Column(Integer, nullable=True)
    proc_ppid = Column(Integer, nullable=True)
    proc_cmdline = Column(Text, nullable=True)
    
    # File-related fields
    file_path = Column(String(500), nullable=True)
    file_action = Column(String(100), nullable=True)
    
    # Network-related fields
    net_raddr = Column(String(45), nullable=True, index=True)  # IPv4/IPv6
    net_rport = Column(Integer, nullable=True)
    net_laddr = Column(String(45), nullable=True)
    net_lport = Column(Integer, nullable=True)
    net_protocol = Column(String(20), nullable=True)
    
    # Raw event data
    raw_data = Column(JSON, nullable=True)
    
    # Relationships
    host = relationship('Host', back_populates='events')
    rule_matches = relationship('RuleMatch', back_populates='event')
    
    def __repr__(self):
        return f'<Event(type={self.event_type}, severity={self.severity}, time={self.event_time})>'


class Rule(Base):
    """Security rule model."""
    
    __tablename__ = 'rules'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    version = Column(String(50), nullable=False, default='1.0')
    enabled = Column(Boolean, nullable=False, default=True)
    definition = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    alerts = relationship('Alert', back_populates='rule')
    rule_matches = relationship('RuleMatch', back_populates='rule')
    
    def __repr__(self):
        return f'<Rule(name={self.name}, version={self.version}, enabled={self.enabled})>'


class Alert(Base):
    """Security alert model."""
    
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey('rules.id'), nullable=False, index=True)
    host_id = Column(Integer, ForeignKey('hosts.id'), nullable=False, index=True)
    first_seen = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_seen = Column(DateTime, nullable=False, default=datetime.utcnow)
    severity = Column(String(50), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default='open')
    artifact = Column(JSON, nullable=True)
    
    # Relationships
    rule = relationship('Rule', back_populates='alerts')
    host = relationship('Host', back_populates='alerts')
    
    def __repr__(self):
        return f'<Alert(title={self.title}, severity={self.severity}, status={self.status})>'


class RuleMatch(Base):
    """Rule match tracking model."""
    
    __tablename__ = 'rule_matches'
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey('rules.id'), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey('events.id'), nullable=False, index=True)
    matched_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    details = Column(JSON, nullable=True)
    
    # Relationships
    rule = relationship('Rule', back_populates='rule_matches')
    event = relationship('Event', back_populates='rule_matches')
    
    def __repr__(self):
        return f'<RuleMatch(rule_id={self.rule_id}, event_id={self.event_id})>'


# Create indexes for performance
Index('idx_events_type_time', Event.event_type, Event.event_time)
Index('idx_events_proc_name', Event.proc_name)
Index('idx_events_net_raddr', Event.net_raddr)
Index('idx_alerts_severity_status', Alert.severity, Alert.status)
Index('idx_alerts_host_status', Alert.host_id, Alert.status)
Index('idx_rule_matches_rule_event', RuleMatch.rule_id, RuleMatch.event_id)
