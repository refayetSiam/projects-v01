import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Filter, Search, Eye, Edit, Trash2, BarChart3, Clock, CheckCircle, AlertCircle, XCircle, Pause, TreePine, Archive, Users, ChevronRight, ChevronDown, X, FolderOpen, Folder, File } from 'lucide-react';
import { loadAllData } from './utils/csvLoader';

const ProjectsActionsModule = () => {
  const [currentView, setCurrentView] = useState('projects');
  const [projectsTab, setProjectsTab] = useState('all');
  const [projectDetailTab, setProjectDetailTab] = useState('project');
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [assetTypes, setAssetTypes] = useState({});
  const [costDatabase, setCostDatabase] = useState({});
  const [customActions, setCustomActions] = useState([]);
  const [showCustomActionForm, setShowCustomActionForm] = useState(false);
  const [editingCustomAction, setEditingCustomAction] = useState(null);
  const [teams, setTeams] = useState([]);
  const [regions, setRegions] = useState([]);
  const [archives, setArchives] = useState({ projects: [], actions: [] });
  const [auditTrail, setAuditTrail] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showActionSelector, setShowActionSelector] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [assetSearchTerm, setAssetSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    projectType: '',
    status: '',
    region: '',
    assetClass: '',
    team: ''
  });

  // Tree view state
  const [expandedNodes, setExpandedNodes] = useState(new Set(['Trees', 'Wetlands', 'Grass']));

  // Action selector state
  const [selectorState, setSelectorState] = useState({
    selectedAssetClass: '',
    selectedAssetType: '',
    selectedAction: '',
    breadcrumbs: [],
    expandedNodes: new Set()
  });

  // Action preview state
  const [previewAction, setPreviewAction] = useState(null);
  
  // Custom action form state
  const [customActionForm, setCustomActionForm] = useState({
    name: '',
    description: '',
    cost: '',
    unit: 'Each',
    lifecycle: '1',
    category: 'Custom Actions'
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await loadAllData();
        
        setAssetTypes(data.assetTypes);
        setCostDatabase(data.costDatabase);
        setAssets(data.assets);
        
        // Debug: Log first asset to check data structure
        if (data.assets.length > 0) {
          console.log('Sample asset data:', data.assets[0]);
        }
        
        // Add the special Renewals project if it doesn't exist
        const renewalsProject = {
          id: 'RENEWALS-PROJECT',
          projectId: 'RENEWALS-2024',
          name: 'Asset Renewals',
          description: 'Automatically generated lifecycle-based renewal actions',
          status: 'Planning',
          startDate: '',
          endDate: '',
          team: 'System Generated',
          region: 'All Regions',
          completion: 0,
          actions: [],
          createdBy: 'system',
          createdDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isRenewalsProject: true
        };
        
        const projectsWithRenewals = data.projects.some(p => p.id === 'RENEWALS-PROJECT') 
          ? data.projects 
          : [renewalsProject, ...data.projects];
        
        setProjects(projectsWithRenewals);
        setAuditTrail(data.auditTrail);
        setTeams(data.teams);
        setRegions(data.regions);
        
        // Load custom actions from localStorage
        const savedCustomActions = localStorage.getItem('customActions');
        if (savedCustomActions) {
          setCustomActions(JSON.parse(savedCustomActions));
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please check if the CSV files are accessible.');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Action modal state
  const [actionForm, setActionForm] = useState({
    assetId: '',
    actionPath: '',
    actionDetails: null,
    recurrence: false,
    recurrenceValue: 1,
    recurrenceUnit: 'years',
    nextDue: '',
    overrideDate: '',
    assetPercentage: 100,
    modeledCost: 0,
    overrideCost: '',
    adjustmentFactor: '',
    isCustomAction: false,
    customActionName: '',
    customActionCost: '',
    assetSize: '',
    unitOfMeasure: '',
    plannedAssetName: '',
    directReplacementCost: '',
    serviceValue: ''
  });

  // Bulk action modal state
  const [bulkActionForm, setBulkActionForm] = useState({
    region: '',
    assetType: '',
    actionPath: '',
    actionDetails: null,
    recurrence: false,
    recurrenceValue: 1,
    recurrenceUnit: 'years',
    nextDue: '',
    overrideDate: '',
    assetPercentage: 100,
    overrideCost: '',
    adjustmentFactor: '',
    isCustomAction: false,
    customActionName: '',
    customActionCost: ''
  });

  // Project modal state
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'Planning',
    startDate: '',
    endDate: '',
    team: '',
    region: '',
    fundingStatus: 'Unfunded',
    projectType: 'New Asset',
    justification: '',
    budgetType: 'Single Year'
  });

  // Generate project ID
  const generateProjectId = () => {
    const year = new Date().getFullYear();
    const existingCount = projects.filter(p => p.projectId.includes(`PROJ-${year}`)).length;
    return `PROJ-${year}-${String(existingCount + 1).padStart(3, '0')}`;
  };

  // Generate recurring actions for 10-year plan
  const generateRecurringActions = (baseAction, project) => {
    if (!baseAction.recurrence) return [baseAction];
    
    const actions = [baseAction];
    const startDate = new Date(baseAction.nextDue);
    const currentYear = new Date().getFullYear();
    
    for (let year = startDate.getFullYear() + baseAction.recurrenceValue; year <= currentYear + 10; year += baseAction.recurrenceValue) {
      const recurringDate = new Date(startDate);
      recurringDate.setFullYear(year);
      
      const recurringAction = {
        ...baseAction,
        id: Date.now() + Math.random(),
        name: generateActionName(baseAction.actionPath.split(' > ').pop(), baseAction.assetId, recurringDate.toISOString().split('T')[0], null, true),
        nextDue: recurringDate.toISOString().split('T')[0],
        status: 'Open',
        completedDate: undefined,
        createdDate: new Date().toISOString()
      };
      
      actions.push(recurringAction);
    }
    
    return actions;
  };

  // Calculate project completion
  const calculateProjectCompletion = (project) => {
    const totalCost = project.actions.reduce((sum, action) => sum + action.cost, 0);
    const completedCost = project.actions
      .filter(action => action.status === 'Completed')
      .reduce((sum, action) => sum + action.cost, 0);
    
    return totalCost > 0 ? Math.round((completedCost / totalCost) * 100) : 0;
  };

  // Calculate total Direct Replacement Cost for a project
  const calculateProjectDirectReplacementCost = (project) => {
    const uniqueAssets = new Set();
    let totalDirectReplacementCost = 0;
    
    project.actions.forEach(action => {
      if (action.assetId && !uniqueAssets.has(action.assetId)) {
        uniqueAssets.add(action.assetId);
        const asset = assets.find(a => a.id === action.assetId);
        if (asset && asset['Direct Replacement Cost']) {
          // Remove currency formatting and convert to number
          const cost = parseFloat(asset['Direct Replacement Cost'].replace(/[$,\s]/g, ''));
          if (!isNaN(cost)) {
            totalDirectReplacementCost += cost;
          }
        }
      }
    });
    
    return totalDirectReplacementCost;
  };

  // Calculate total Service Value for a project
  const calculateProjectServiceValue = (project) => {
    const uniqueAssets = new Set();
    let totalServiceValue = 0;
    
    project.actions.forEach(action => {
      if (action.assetId && !uniqueAssets.has(action.assetId)) {
        uniqueAssets.add(action.assetId);
        const asset = assets.find(a => a.id === action.assetId);
        if (asset && asset['Service Value']) {
          // Remove currency formatting and convert to number
          const value = parseFloat(asset['Service Value'].replace(/[$,\s]/g, ''));
          if (!isNaN(value)) {
            totalServiceValue += value;
          }
        }
      }
    });
    
    return totalServiceValue;
  };

  // Update project completions and asset values
  useEffect(() => {
    if (assets.length > 0) {
      setProjects(prev => prev.map(project => ({
        ...project,
        completion: calculateProjectCompletion(project),
        totalDirectReplacementCost: calculateProjectDirectReplacementCost(project),
        totalServiceValue: calculateProjectServiceValue(project)
      })));
    }
  }, [assets]);

  const addAuditEntry = (entityType, entityId, field, oldValue, newValue, changedBy = 'current_user') => {
    const newEntry = {
      id: Date.now(),
      entityType,
      entityId,
      field,
      oldValue,
      newValue,
      changedBy,
      changedDate: new Date().toISOString()
    };
    setAuditTrail(prev => [newEntry, ...prev]);
  };

  const calculateModeledCost = (assetId, actionDetails, percentage, adjustmentFactor = '', assetSize = '', customCost = '') => {
    // If custom cost is provided, use it
    if (customCost && !isNaN(parseFloat(customCost))) {
      let cost = parseFloat(customCost);
      if (adjustmentFactor && !isNaN(parseFloat(adjustmentFactor))) {
        cost = cost * parseFloat(adjustmentFactor);
      }
      return Math.round(cost);
    }
    
    // Use provided asset size or find asset
    let size = assetSize && !isNaN(parseFloat(assetSize)) ? parseFloat(assetSize) : 0;
    if (!size && assetId) {
      const asset = assets.find(a => a.id === assetId);
      size = asset ? asset.size : 0;
    }
    
    if (!size || !actionDetails || !percentage) return 0;
    
    let cost = size * (percentage / 100) * actionDetails.cost;
    
    // Apply adjustment factor if provided (as simple multiplier)
    if (adjustmentFactor && !isNaN(parseFloat(adjustmentFactor))) {
      cost = cost * parseFloat(adjustmentFactor);
    }
    
    return Math.round(cost);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Open': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Planning': return <Pause className="w-4 h-4 text-blue-500" />;
      case 'Archived': return <Archive className="w-4 h-4 text-gray-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded";
    switch (status) {
      case 'Completed': return `${baseClasses} bg-green-100 text-green-800`;
      case 'In Progress': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Open': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Cancelled': return `${baseClasses} bg-red-100 text-red-800`;
      case 'Planning': return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'Archived': return `${baseClasses} bg-gray-100 text-gray-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const generateActionName = (actionType, assetId, nextDue, overrideDate, recurrence, regionOverride = null, plannedAssetName = '', isCustomAction = false) => {
    // Handle custom actions
    if (isCustomAction && actionType) {
      let name = actionType;
      if (plannedAssetName) {
        name += ` - ${plannedAssetName}`;
      }
      if (recurrence && (overrideDate || nextDue)) {
        const date = new Date(overrideDate || nextDue);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        name += ` - ${month} ${year}`;
      }
      return name;
    }
    
    // Handle actions without assets
    if (!assetId && plannedAssetName) {
      let name = actionType ? `${actionType} - ${plannedAssetName}` : plannedAssetName;
      if (recurrence && (overrideDate || nextDue)) {
        const date = new Date(overrideDate || nextDue);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        name += ` - ${month} ${year}`;
      }
      return name;
    }
    
    if (!actionType || !assetId) return '';
    
    // Find the asset to get the region, or use override for bulk actions
    let regionName = regionOverride;
    if (!regionName && assetId !== 'BULK') {
      const asset = assets.find(a => a.id === assetId);
      regionName = asset ? asset.region : '';
    }
    
    // Format: "Region Name - Action - Asset"
    let name = regionName ? `${regionName} - ${actionType} - ${assetId}` : `${actionType} - ${assetId}`;
    
    if (recurrence && (overrideDate || nextDue)) {
      const date = new Date(overrideDate || nextDue);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      name += ` - ${month} ${year}`;
    }
    
    return name;
  };

  const filteredProjects = projects.filter(project => {
    if (projectsTab === 'archived' && project.status !== 'Archived') return false;
    if (projectsTab === 'all' && project.status === 'Archived') return false;
    
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.region.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = (!filters.status || project.status === filters.status) &&
                          (!filters.team || project.team === filters.team) &&
                          (!filters.region || project.region === filters.region);
    
    return matchesSearch && matchesFilters;
  });

  const filteredAssets = (searchTerm = assetSearchTerm) => {
    if (!searchTerm) return assets;
    return assets.filter(asset => {
      // Check if asset type exists to prevent errors
      const assetType = assetTypes[asset.type];
      if (!assetType) {
        console.warn(`Asset type '${asset.type}' not found for asset '${asset.id}'`);
        return false;
      }
      
      return asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assetType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.region.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const downloadActionsCSV = () => {
    const csvData = [];
    projects.forEach(project => {
      project.actions.forEach(action => {
        const asset = assets.find(a => a.id === action.assetId);
        const assetConfig = assetTypes[asset?.type];
        const actionYear = new Date(action.overrideDate || action.nextDue || action.completedDate || '').getFullYear();
        
        csvData.push({
          'Project Name': project.name,
          'Project ID': project.projectId,
          'Region Name': project.region,
          'Asset Class': assetConfig?.assetClass || '',
          'Asset Name': asset?.name || '',
          'Asset Size': asset?.size || '',
          'Action Name': action.name,
          'Action Cost': action.cost,
          'Action Year': actionYear || '',
          'Status': action.status,
          'Due Date': action.overrideDate || action.nextDue || '',
          'Completed Date': action.completedDate || ''
        });
      });
    });
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'actions-list-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openProjectModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        team: project.team,
        region: project.region,
        fundingStatus: project.fundingStatus || 'Unfunded',
        projectType: project.projectType || 'New Asset',
        justification: project.justification || '',
        budgetType: project.budgetType || 'Single Year'
      });
    } else {
      setEditingProject(null);
      setProjectForm({
        name: '',
        description: '',
        status: 'Planning',
        startDate: '',
        endDate: '',
        team: '',
        region: '',
        fundingStatus: 'Unfunded',
        projectType: 'New Asset',
        justification: '',
        budgetType: 'Single Year'
      });
    }
    setShowProjectModal(true);
  };

  const saveProject = () => {
    const newProject = {
      id: editingProject ? editingProject.id : Date.now(),
      projectId: editingProject ? editingProject.projectId : generateProjectId(),
      ...projectForm,
      completion: editingProject ? editingProject.completion : 0,
      actions: editingProject ? editingProject.actions : [],
      createdBy: editingProject ? editingProject.createdBy : 'current_user',
      createdDate: editingProject ? editingProject.createdDate : new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    if (editingProject) {
      Object.keys(projectForm).forEach(field => {
        if (editingProject[field] !== projectForm[field]) {
          addAuditEntry('Project', editingProject.id, field, editingProject[field], projectForm[field]);
        }
      });
      
      setProjects(prev => prev.map(p => p.id === editingProject.id ? newProject : p));
      if (selectedProject && selectedProject.id === editingProject.id) {
        setSelectedProject(newProject);
      }
    } else {
      setProjects(prev => [...prev, newProject]);
    }

    setShowProjectModal(false);
  };

  const openActionModal = (action = null) => {
    if (action) {
      setEditingAction(action);
      // Find the asset to populate asset value fields
      const selectedAsset = assets.find(a => a.id === action.assetId);
      const assetType = selectedAsset ? assetTypes[selectedAsset.type] : null;
      
      setActionForm({
        assetId: action.assetId,
        actionPath: action.actionPath,
        actionDetails: null,
        recurrence: action.recurrence || false,
        recurrenceValue: action.recurrenceValue || 1,
        recurrenceUnit: action.recurrenceUnit || 'years',
        nextDue: action.nextDue || '',
        overrideDate: action.overrideDate || '',
        assetPercentage: action.assetPercentage || 100,
        modeledCost: action.modeledCost || 0,
        overrideCost: action.overrideCost || '',
        adjustmentFactor: '',
        isCustomAction: false,
        customActionName: '',
        customActionCost: '',
        assetSize: selectedAsset ? selectedAsset.size.toString() : '',
        unitOfMeasure: assetType ? assetType.unit : '',
        plannedAssetName: '',
        directReplacementCost: selectedAsset ? selectedAsset['Direct Replacement Cost'] || '' : '',
        serviceValue: selectedAsset ? selectedAsset['Service Value'] || '' : ''
      });
    } else {
      setEditingAction(null);
      setActionForm({
        assetId: '',
        actionPath: '',
        actionDetails: null,
        recurrence: false,
        recurrenceValue: 1,
        recurrenceUnit: 'years',
        nextDue: '',
        overrideDate: '',
        assetPercentage: 100,
        modeledCost: 0,
        overrideCost: '',
        adjustmentFactor: '',
        isCustomAction: false,
        customActionName: '',
        customActionCost: '',
        assetSize: '',
        unitOfMeasure: '',
        plannedAssetName: '',
        directReplacementCost: '',
        serviceValue: ''
      });
    }
    setAssetSearchTerm('');
    setShowActionModal(true);
  };

  const toggleNode = (nodePath) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodePath)) {
        newSet.delete(nodePath);
      } else {
        newSet.add(nodePath);
      }
      return newSet;
    });
  };

  const previewActionFromTree = (actionPath, actionDetails, actionName) => {
    setPreviewAction({
      path: actionPath,
      details: actionDetails,
      name: actionName
    });
  };

  const selectActionFromTree = (actionPath, actionDetails) => {
    // Update the appropriate form based on which modal is open
    if (showBulkActionModal) {
      setBulkActionForm(prev => ({
        ...prev,
        actionPath: actionPath,
        actionDetails: actionDetails
      }));
    } else {
      setActionForm(prev => ({
        ...prev,
        actionPath: actionPath,
        actionDetails: actionDetails
      }));
    }
    setShowActionSelector(false);
    setPreviewAction(null);
  };

  // Custom action management functions
  const saveCustomAction = () => {
    const newCustomAction = {
      id: editingCustomAction ? editingCustomAction.id : Date.now(),
      ...customActionForm,
      cost: parseFloat(customActionForm.cost),
      lifecycle: parseInt(customActionForm.lifecycle)
    };

    let updatedCustomActions;
    if (editingCustomAction) {
      updatedCustomActions = customActions.map(action => 
        action.id === editingCustomAction.id ? newCustomAction : action
      );
    } else {
      updatedCustomActions = [...customActions, newCustomAction];
    }

    setCustomActions(updatedCustomActions);
    localStorage.setItem('customActions', JSON.stringify(updatedCustomActions));
    
    // Reset form
    setCustomActionForm({
      name: '',
      description: '',
      cost: '',
      unit: 'Each',
      lifecycle: '1',
      category: 'Custom Actions'
    });
    setEditingCustomAction(null);
    setShowCustomActionForm(false);
  };

  const deleteCustomAction = (actionId) => {
    if (window.confirm('Are you sure you want to delete this custom action?')) {
      const updatedCustomActions = customActions.filter(action => action.id !== actionId);
      setCustomActions(updatedCustomActions);
      localStorage.setItem('customActions', JSON.stringify(updatedCustomActions));
    }
  };

  const openCustomActionForm = (action = null) => {
    if (action) {
      setEditingCustomAction(action);
      setCustomActionForm({
        name: action.name,
        description: action.description,
        cost: action.cost.toString(),
        unit: action.unit,
        lifecycle: action.lifecycle.toString(),
        category: action.category
      });
    } else {
      setEditingCustomAction(null);
      setCustomActionForm({
        name: '',
        description: '',
        cost: '',
        unit: 'Each',
        lifecycle: '1',
        category: 'Custom Actions'
      });
    }
    setShowCustomActionForm(true);
  };

  // Update modeled cost when form changes
  useEffect(() => {
    const modeledCost = calculateModeledCost(
      actionForm.assetId, 
      actionForm.actionDetails, 
      actionForm.assetPercentage,
      actionForm.adjustmentFactor,
      actionForm.assetSize,
      actionForm.customActionCost
    );
    setActionForm(prev => ({ ...prev, modeledCost }));
  }, [actionForm.assetId, actionForm.actionDetails, actionForm.assetPercentage, actionForm.adjustmentFactor, actionForm.assetSize, actionForm.customActionCost, assets]);
  
  // Update asset size and unit when asset is selected
  useEffect(() => {
    if (actionForm.assetId && !actionForm.isCustomAction && assets.length > 0) {
      const selectedAsset = assets.find(a => a.id === actionForm.assetId);
      if (selectedAsset) {
        console.log('Selected asset:', selectedAsset);
        console.log('Direct Replacement Cost:', selectedAsset['Direct Replacement Cost']);
        console.log('Service Value:', selectedAsset['Service Value']);
        const assetType = assetTypes[selectedAsset.type];
        
        setActionForm(prev => ({
          ...prev,
          assetSize: selectedAsset.size.toString(),
          unitOfMeasure: assetType ? assetType.unit : '',
          directReplacementCost: selectedAsset['Direct Replacement Cost'] || '',
          serviceValue: selectedAsset['Service Value'] || ''
        }));
      }
    } else if (!actionForm.assetId) {
      // Clear asset data when no asset is selected
      setActionForm(prev => ({
        ...prev,
        assetSize: '',
        unitOfMeasure: '',
        directReplacementCost: '',
        serviceValue: ''
      }));
    }
  }, [actionForm.assetId, actionForm.isCustomAction, assets, assetTypes]);

  const saveAction = () => {
    const actionName = generateActionName(
      actionForm.actionPath.split(' > ').pop(), 
      actionForm.assetId, 
      actionForm.nextDue, 
      actionForm.overrideDate, 
      actionForm.recurrence
    );
    const finalCost = actionForm.overrideCost ? parseInt(actionForm.overrideCost) : actionForm.modeledCost;
    
    const baseAction = {
      id: editingAction ? editingAction.id : Date.now(),
      name: actionName,
      assetId: actionForm.assetId,
      actionPath: actionForm.actionPath,
      status: editingAction ? editingAction.status : 'Open',
      nextDue: actionForm.nextDue,
      overrideDate: actionForm.overrideDate || null,
      recurrence: actionForm.recurrence,
      recurrenceValue: actionForm.recurrence ? actionForm.recurrenceValue : null,
      recurrenceUnit: actionForm.recurrence ? actionForm.recurrenceUnit : null,
      assetPercentage: actionForm.assetPercentage,
      modeledCost: actionForm.modeledCost,
      overrideCost: actionForm.overrideCost ? parseInt(actionForm.overrideCost) : null,
      cost: finalCost,
      createdBy: editingAction ? editingAction.createdBy : 'current_user',
      createdDate: editingAction ? editingAction.createdDate : new Date().toISOString(),
      ...(editingAction?.completedDate && { completedDate: editingAction.completedDate })
    };

    // Generate recurring actions if applicable
    const allActions = generateRecurringActions(baseAction, selectedProject);

    if (editingAction) {
      Object.keys(actionForm).forEach(field => {
        if (editingAction[field] !== actionForm[field]) {
          addAuditEntry('Action', editingAction.id, field, editingAction[field], actionForm[field]);
        }
      });
    }

    const updatedProject = {
      ...selectedProject,
      actions: editingAction 
        ? [
            ...selectedProject.actions.filter(a => {
              // Remove the original action being edited
              if (a.id === editingAction.id) return false;
              
              // If the action was previously recurring, also remove future recurring actions
              // (Actions with the same asset and action path but different dates)
              if (editingAction.recurrence && !actionForm.recurrence) {
                const isSameActionSeries = a.assetId === editingAction.assetId && 
                                         a.actionPath === editingAction.actionPath &&
                                         a.id !== editingAction.id &&
                                         new Date(a.nextDue) > new Date(editingAction.nextDue);
                return !isSameActionSeries;
              }
              
              return true;
            }),
            ...allActions // Add the updated action and any new recurring actions
          ]
        : [...selectedProject.actions, ...allActions],
      lastModified: new Date().toISOString()
    };

    updatedProject.completion = calculateProjectCompletion(updatedProject);
    updatedProject.totalDirectReplacementCost = calculateProjectDirectReplacementCost(updatedProject);
    updatedProject.totalServiceValue = calculateProjectServiceValue(updatedProject);

    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));

    setShowActionModal(false);
  };

  const updateActionStatus = (actionId, newStatus) => {
    const action = selectedProject.actions.find(a => a.id === actionId);
    const oldStatus = action.status;
    
    let updatedAction = { 
      ...action, 
      status: newStatus,
      ...(newStatus === 'Completed' && { completedDate: new Date().toISOString().split('T')[0] })
    };

    if (newStatus === 'Completed' || newStatus === 'Archived') {
      setArchives(prev => ({
        ...prev,
        actions: [...prev.actions, { ...updatedAction, archivedDate: new Date().toISOString(), archivedBy: 'current_user' }]
      }));
    }
    
    const updatedProject = {
      ...selectedProject,
      actions: selectedProject.actions.map(a => a.id === actionId ? updatedAction : a),
      lastModified: new Date().toISOString()
    };

    updatedProject.completion = calculateProjectCompletion(updatedProject);
    updatedProject.totalDirectReplacementCost = calculateProjectDirectReplacementCost(updatedProject);
    updatedProject.totalServiceValue = calculateProjectServiceValue(updatedProject);
    
    setSelectedProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
    
    addAuditEntry('Action', actionId, 'status', oldStatus, newStatus);
  };

  const deleteAction = (actionId) => {
    if (window.confirm('Are you sure you want to delete this action? This action cannot be undone.')) {
      const action = selectedProject.actions.find(a => a.id === actionId);
      if (action) {
        setArchives(prev => ({
          ...prev,
          actions: [...prev.actions, { ...action, deletedDate: new Date().toISOString(), deletedBy: 'current_user' }]
        }));
        
        const updatedProject = {
          ...selectedProject,
          actions: selectedProject.actions.filter(a => a.id !== actionId),
          lastModified: new Date().toISOString()
        };

        updatedProject.completion = calculateProjectCompletion(updatedProject);
        updatedProject.totalDirectReplacementCost = calculateProjectDirectReplacementCost(updatedProject);
        updatedProject.totalServiceValue = calculateProjectServiceValue(updatedProject);
        
        setSelectedProject(updatedProject);
        setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
        
        addAuditEntry('Action', actionId, 'status', action.status, 'Deleted');
      }
    }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* NOVION Branding */}
      <div className="flex items-center p-4 border-b border-gray-200" style={{ backgroundColor: '#5B6ACD' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <BarChart3 className="w-4 h-4" style={{ color: '#5B6ACD' }} />
          </div>
          <span className="text-white font-semibold text-lg">NOVION</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          <div
            onClick={() => setCurrentView('assets')}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer ${
              currentView === 'assets' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <TreePine className="w-4 h-4 mr-3" />
            Assets
          </div>
          <div
            onClick={() => setCurrentView('projects')}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer ${
              currentView === 'projects' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Folder className="w-4 h-4 mr-3" />
            Projects
          </div>
          <div
            onClick={() => setCurrentView('reporting')}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer ${
              currentView === 'reporting' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-3" />
            Reporting
          </div>
          <div
            onClick={() => setCurrentView('capital-plan')}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer ${
              currentView === 'capital-plan' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <DollarSign className="w-4 h-4 mr-3" />
            Capital Plan
          </div>
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg w-full">
          <Archive className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );

  const renderActionSelector = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Select Action</h2>
          <button
            onClick={() => setShowActionSelector(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Tree Explorer */}
          <div className="w-1/2 border-r overflow-y-auto p-6 max-h-full">
            <div className="space-y-1">
              {/* Custom Actions Section */}
              <div>
                <div
                  onClick={() => toggleNode('Custom Actions')}
                  className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  {expandedNodes.has('Custom Actions') ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 mr-1" />
                  )}
                  <FolderOpen className="w-4 h-4 text-purple-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 break-words">Custom Actions</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCustomActionForm();
                    }}
                    className="ml-auto p-1 text-purple-600 hover:bg-purple-100 rounded"
                    title="Add Custom Action"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {expandedNodes.has('Custom Actions') && (
                  <div className="ml-6 space-y-1">
                    {customActions.map((action) => (
                      <div
                        key={action.id}
                        onClick={() => previewActionFromTree(`Custom Actions > ${action.name}`, action, action.name)}
                        className={`flex items-center py-2 px-2 hover:bg-blue-50 rounded cursor-pointer group ${
                          previewAction?.name === action.name ? 'bg-blue-100' : ''
                        }`}
                      >
                        <File className="w-4 h-4 text-purple-400 mr-2 ml-1" />
                        <span className="text-sm text-gray-600 break-words flex-1">{action.name}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomActionForm(action);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomAction(action.id);
                            }}
                            className="p-1 text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Cost Database Actions */}
              {Object.entries(costDatabase).map(([assetClass, assetTypesObj]) => (
                <div key={assetClass}>
                  <div
                    onClick={() => toggleNode(assetClass)}
                    className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    {expandedNodes.has(assetClass) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 mr-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 mr-1" />
                    )}
                    <FolderOpen className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900 break-words">{assetClass}</span>
                  </div>

                  {expandedNodes.has(assetClass) && (
                    <div className="ml-6 space-y-1">
                      {Object.entries(assetTypesObj).map(([assetType, actions]) => (
                        <div key={assetType}>
                          <div
                            onClick={() => toggleNode(`${assetClass}/${assetType}`)}
                            className="flex items-center py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            {expandedNodes.has(`${assetClass}/${assetType}`) ? (
                              <ChevronDown className="w-4 h-4 text-gray-500 mr-1" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500 mr-1" />
                            )}
                            <Folder className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-700 break-words">{assetType}</span>
                          </div>

                          {expandedNodes.has(`${assetClass}/${assetType}`) && (
                            <div className="ml-6 space-y-1">
                              {Object.entries(actions).map(([actionName, actionDetails]) => (
                                <div
                                  key={actionName}
                                  onClick={() => previewActionFromTree(`${assetClass} > ${assetType} > ${actionName}`, actionDetails, actionName)}
                                  className={`flex items-center py-2 px-2 hover:bg-blue-50 rounded cursor-pointer ${
                                    previewAction?.name === actionName ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  <File className="w-4 h-4 text-gray-400 mr-2 ml-1" />
                                  <span className="text-sm text-gray-600 break-words">{actionName}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details Panel */}
          <div className="w-1/2 p-6 bg-gray-50">
            {previewAction ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{previewAction.name}</h3>
                  
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">DESCRIPTION</label>
                      <p className="text-sm text-gray-900">{previewAction.details.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">COST</label>
                        <p className="text-sm text-gray-900">${previewAction.details.cost}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">UNIT</label>
                        <p className="text-sm text-gray-900">{previewAction.details.unit}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">LIFECYCLE</label>
                      <p className="text-sm text-gray-900">{previewAction.details.lifecycle}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => selectActionFromTree(previewAction.path, previewAction.details)}
                    className="w-full px-4 py-3 text-white rounded-lg flex items-center justify-center gap-2 hover:opacity-90"
                    style={{ backgroundColor: '#5B6ACD' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <TreePine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p>Select an action from the tree to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProjectsList = () => (
    <div className="flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => openProjectModal()}
          className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
          style={{ backgroundColor: '#5B6ACD' }}
        >
          <Plus className="w-4 h-4" />
          CREATE
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setProjectsTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              projectsTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setProjectsTab('archived')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              projectsTab === 'archived'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ARCHIVED
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={filters.region}
            onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
          >
            <option value="">All Regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={filters.team}
            onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            value={filters.assetClass}
            onChange={(e) => setFilters(prev => ({ ...prev, assetClass: e.target.value }))}
          >
            <option value="">All Asset Classes</option>
            <option value="Trees">Trees</option>
            <option value="Wetlands">Wetlands</option>
            <option value="Grass">Grass</option>
          </select>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECT NAME</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROJECT ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REGION</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TOTAL CAPITAL COST</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMPLETION</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TEAM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project) => {
              const totalBudget = project.actions.reduce((sum, action) => sum + action.cost, 0);
              
              return (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div
                      onClick={() => {
                        setSelectedProject(project);
                        setCurrentView('project-detail');
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      {project.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.projectId}</td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(project.status)}>{project.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.region}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${totalBudget.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.completion}%</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{project.team}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!project.isRenewalsProject && (
                        <button
                          onClick={() => openProjectModal(project)}
                          className="text-gray-600 hover:text-gray-800"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {project.isRenewalsProject && (
                        <span className="text-xs text-gray-500 italic">System Generated</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProjectDetail = () => {
    const activeActions = selectedProject.actions.filter(action => action.status !== 'Completed' && action.status !== 'Archived');
    const archivedActions = selectedProject.actions.filter(action => action.status === 'Completed' || action.status === 'Archived');
    
    return (
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('projects')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              ← Back to Projects
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedProject?.name}</h1>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => openProjectModal(selectedProject)}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: '#5B6ACD' }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setProjectDetailTab('project')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                projectDetailTab === 'project'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              PROJECT
            </button>
            <button
              onClick={() => setProjectDetailTab('actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                projectDetailTab === 'actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ACTIONS
            </button>
            <button
              onClick={() => setProjectDetailTab('archived-actions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                projectDetailTab === 'archived-actions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ARCHIVED ACTIONS
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {projectDetailTab === 'project' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Project Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">PROJECT NAME</label>
                  <p className="text-sm text-gray-900">{selectedProject?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">PROJECT ID</label>
                  <p className="text-sm text-gray-900">{selectedProject?.projectId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">STATUS</label>
                  <span className={getStatusBadge(selectedProject?.status)}>{selectedProject?.status}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">REGION</label>
                  <p className="text-sm text-gray-900">{selectedProject?.region}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">TEAM</label>
                  <p className="text-sm text-gray-900">{selectedProject?.team}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">COMPLETION</label>
                  <p className="text-sm text-gray-900">{selectedProject?.completion}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">FUNDING STATUS</label>
                  <p className="text-sm text-gray-900">{selectedProject?.fundingStatus || 'Unfunded'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">PROJECT TYPE</label>
                  <p className="text-sm text-gray-900">{selectedProject?.projectType || 'New Asset'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">BUDGET TYPE</label>
                  <p className="text-sm text-gray-900">{selectedProject?.budgetType || 'Single Year'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">TOTAL DIRECT REPLACEMENT COST</label>
                  <p className="text-sm text-gray-900">${selectedProject?.totalDirectReplacementCost?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">TOTAL SERVICE VALUE</label>
                  <p className="text-sm text-gray-900">${selectedProject?.totalServiceValue?.toLocaleString() || '0'}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-1">DESCRIPTION</label>
                <p className="text-sm text-gray-900">{selectedProject?.description}</p>
              </div>

              {selectedProject?.justification && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-500 mb-1">JUSTIFICATION</label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedProject?.justification}</p>
                </div>
              )}
            </div>
          )}

          {projectDetailTab === 'actions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Active Actions ({activeActions.length})</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowBulkActionModal(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Bulk Add
                  </button>
                  <button
                    onClick={() => openActionModal()}
                    className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
                    style={{ backgroundColor: '#5B6ACD' }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Path</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeActions.map((action) => {
                      const asset = assets.find(a => a.id === action.assetId);
                      const effectiveDate = action.overrideDate || action.nextDue;
                      
                      return (
                        <tr key={action.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{action.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{asset?.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{action.actionPath}</td>
                          <td className="px-6 py-4">
                            <select
                              value={action.status}
                              onChange={(e) => updateActionStatus(action.id, e.target.value)}
                              className="text-sm border-gray-300 rounded"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{effectiveDate}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">${action.cost.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openActionModal(action)}
                                className="text-gray-600 hover:text-gray-800"
                                title="Edit Action"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteAction(action.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Action"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {projectDetailTab === 'archived-actions' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Archived Actions ({archivedActions.length})</h3>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {archivedActions.map((action) => {
                      const asset = assets.find(a => a.id === action.assetId);
                      
                      return (
                        <tr key={action.id} className="hover:bg-gray-50 opacity-75">
                          <td className="px-6 py-4 text-sm font-medium text-gray-700">{action.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{asset?.id}</td>
                          <td className="px-6 py-4">
                            <span className={getStatusBadge(action.status)}>{action.status}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{action.completedDate || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">${action.cost.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCapitalPlan = () => {
    const generateReportData = () => {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
      
      return years.map(year => {
        let actualSpend = 0;
        let plannedSpend = 0;
        
        projects.forEach(project => {
          project.actions.forEach(action => {
            const actionDate = action.overrideDate || action.nextDue || action.completedDate;
            if (actionDate) {
              const actionYear = new Date(actionDate).getFullYear();
              if (actionYear === year) {
                if (action.status === 'Completed' && action.completedDate) {
                  actualSpend += action.cost;
                } else {
                  plannedSpend += action.cost;
                }
              }
            }
          });
        });
        
        return {
          year,
          actualSpend,
          plannedSpend,
          totalSpend: actualSpend + plannedSpend
        };
      });
    };

    const reportData = generateReportData();
    const maxSpend = Math.max(...reportData.map(d => d.totalSpend));

    return (
      <div className="flex-1">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Capital Plan</h1>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">10-Year Capital Expenditure Forecast</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Actual Spend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Planned Spend</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Spend</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Spend</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visual</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((row) => (
                    <tr key={row.year} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{row.year}</td>
                      <td className="px-4 py-4 text-sm text-green-600 font-medium">
                        ${row.actualSpend.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-blue-600 font-medium">
                        ${row.plannedSpend.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        ${row.totalSpend.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex w-full h-6 bg-gray-200 rounded">
                          {row.actualSpend > 0 && (
                            <div 
                              className="bg-green-500 rounded-l"
                              style={{ width: `${maxSpend > 0 ? (row.actualSpend / maxSpend) * 100 : 0}%` }}
                            ></div>
                          )}
                          {row.plannedSpend > 0 && (
                            <div 
                              className="bg-blue-500 rounded-r"
                              style={{ width: `${maxSpend > 0 ? (row.plannedSpend / maxSpend) * 100 : 0}%` }}
                            ></div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActionModal = () => {
    const filteredAssetsForAction = filteredAssets(assetSearchTerm);
    const selectedAsset = assets.find(a => a.id === actionForm.assetId);
    const previewName = generateActionName(
      actionForm.isCustomAction ? actionForm.customActionName : actionForm.actionPath.split(' > ').pop(), 
      actionForm.assetId, 
      actionForm.nextDue, 
      actionForm.overrideDate, 
      actionForm.recurrence,
      null,
      actionForm.plannedAssetName,
      actionForm.isCustomAction
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">
            {editingAction ? 'Edit Action' : 'Add New Action'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionForm.assetId ? 'Asset' : 'Asset Name'}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={actionForm.assetId}
                  onChange={(e) => setActionForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  size={Math.min(filteredAssetsForAction.length + 1, 5)}
                >
                  <option value="">Select an asset...</option>
                  {filteredAssetsForAction.map(asset => {
                    const assetType = assetTypes[asset.type];
                    const assetTypeName = assetType ? assetType.name : asset.type;
                    return (
                      <option key={asset.id} value={asset.id}>
                        {asset.id} - {asset.name} ({assetTypeName})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowActionSelector(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white hover:bg-gray-50"
                >
                  {actionForm.actionPath || 'Select action...'}
                </button>
                {actionForm.actionDetails && (
                  <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                    {actionForm.actionDetails.description} - ${actionForm.actionDetails.cost}/{actionForm.actionDetails.unit}
                  </div>
                )}
              </div>
            </div>

            {!actionForm.assetId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Asset Name (For actions without existing assets)</label>
                <input
                  type="text"
                  value={actionForm.plannedAssetName}
                  onChange={(e) => setActionForm(prev => ({ ...prev, plannedAssetName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., New Oak Tree - Location X"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Size {actionForm.assetId ? '(Auto-filled)' : '(Manual Entry)'}
                </label>
                <input
                  type="number"
                  value={actionForm.assetSize}
                  onChange={(e) => setActionForm(prev => ({ ...prev, assetSize: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter asset size"
                  disabled={!!actionForm.assetId && !actionForm.isCustomAction}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure {actionForm.assetId ? '(Auto-filled)' : '(Manual Entry)'}
                </label>
                <input
                  type="text"
                  value={actionForm.unitOfMeasure}
                  onChange={(e) => setActionForm(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., SM, Each, meters"
                  disabled={!!actionForm.assetId && !actionForm.isCustomAction}
                />
              </div>
            </div>

            {/* Asset Value Fields - Only shown when asset is selected */}
            {actionForm.assetId && (actionForm.directReplacementCost || actionForm.serviceValue) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direct Replacement Cost
                  </label>
                  <input
                    type="text"
                    value={actionForm.directReplacementCost}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    readOnly
                    placeholder="Not specified"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Value
                  </label>
                  <input
                    type="text"
                    value={actionForm.serviceValue}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    readOnly
                    placeholder="Not specified"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date *</label>
                <input
                  type="date"
                  value={actionForm.nextDue}
                  onChange={(e) => setActionForm(prev => ({ ...prev, nextDue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Override Date (Optional)</label>
                <input
                  type="date"
                  value={actionForm.overrideDate}
                  onChange={(e) => setActionForm(prev => ({ ...prev, overrideDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={actionForm.recurrence}
                  onChange={(e) => setActionForm(prev => ({ ...prev, recurrence: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">This action recurs (will generate for 10-year plan)</span>
              </label>
            </div>

            {actionForm.recurrence && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                <div className="flex gap-2">
                  <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Every</span>
                  <input
                    type="number"
                    min="1"
                    value={actionForm.recurrenceValue}
                    onChange={(e) => setActionForm(prev => ({ ...prev, recurrenceValue: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={actionForm.recurrenceUnit}
                    onChange={(e) => setActionForm(prev => ({ ...prev, recurrenceUnit: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Percentage</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={actionForm.assetPercentage}
                  onChange={(e) => setActionForm(prev => ({ ...prev, assetPercentage: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter percentage (1-100)"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Percentage of asset size affected by this action
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Factor (Multiplier)</label>
                <input
                  type="number"
                  step="0.1"
                  value={actionForm.adjustmentFactor}
                  onChange={(e) => setActionForm(prev => ({ ...prev, adjustmentFactor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1.1 for 10% increase"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Simple multiplier to adjust final cost (e.g., 1.2 = 20% increase)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modeled Cost</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={actionForm.modeledCost.toLocaleString()}
                    readOnly
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Auto-calculated based on asset size and percentage
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Override Cost (Optional)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={actionForm.overrideCost}
                    onChange={(e) => setActionForm(prev => ({ ...prev, overrideCost: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave blank to use modeled cost"
                  />
                </div>
              </div>
            </div>

            {previewName && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Action Preview:</p>
                <p className="font-medium">{previewName}</p>
                <div className="text-sm text-gray-600 mt-1">
                  Final Cost: ${(actionForm.overrideCost ? parseInt(actionForm.overrideCost) : actionForm.modeledCost).toLocaleString()}
                  {actionForm.overrideCost && (
                    <span className="text-orange-600"> (Override Applied)</span>
                  )}
                </div>
                {actionForm.recurrence && (
                  <div className="text-sm text-blue-600 mt-1">
                    🔄 Will generate recurring actions for 10-year capital plan
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowActionModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={saveAction}
              disabled={
                !actionForm.nextDue ||
                (actionForm.isCustomAction && !actionForm.customActionName) ||
                (!actionForm.isCustomAction && !actionForm.actionPath) ||
                (!actionForm.assetId && !actionForm.plannedAssetName)
              }
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#5B6ACD' }}
            >
              {editingAction ? 'Update' : 'Add'} Action
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openBulkActionModal = () => {
    setBulkActionForm({
      region: '',
      assetType: '',
      actionPath: '',
      actionDetails: null,
      recurrence: false,
      recurrenceValue: 1,
      recurrenceUnit: 'years',
      nextDue: '',
      overrideDate: '',
      assetPercentage: 100,
      overrideCost: '',
      adjustmentFactor: '',
      isCustomAction: false,
      customActionName: '',
      customActionCost: ''
    });
    setShowBulkActionModal(true);
  };

  const saveBulkActions = () => {
    const requiredFieldsValid = bulkActionForm.region && 
                                bulkActionForm.assetType && 
                                bulkActionForm.nextDue &&
                                (bulkActionForm.isCustomAction ? bulkActionForm.customActionName : bulkActionForm.actionPath);
    
    if (!requiredFieldsValid) {
      alert('Please fill in all required fields');
      return;
    }

    // Get asset class from asset type
    const assetClass = Object.values(assetTypes).find(type => type.name === bulkActionForm.assetType)?.assetClass;
    
    // Filter assets by region and asset class
    const matchingAssets = assets.filter(asset => {
      const assetConfig = assetTypes[asset.type];
      return asset.region === bulkActionForm.region && assetConfig?.assetClass === assetClass;
    });

    if (matchingAssets.length === 0) {
      alert(`No assets found for region "${bulkActionForm.region}" and asset type "${bulkActionForm.assetType}"`);
      return;
    }

    // Create actions for all matching assets
    const newActions = [];
    matchingAssets.forEach(asset => {
      const actionDetails = bulkActionForm.isCustomAction ? 
        { cost: parseFloat(bulkActionForm.customActionCost), unit: 'Each' } : 
        bulkActionForm.actionDetails;
      
      const modeledCost = calculateModeledCost(
        asset.id, 
        actionDetails, 
        bulkActionForm.assetPercentage,
        bulkActionForm.adjustmentFactor,
        asset.size.toString(),
        bulkActionForm.isCustomAction ? bulkActionForm.customActionCost : ''
      );
      const finalCost = bulkActionForm.overrideCost ? parseInt(bulkActionForm.overrideCost) : modeledCost;
      
      const baseAction = {
        id: Date.now() + Math.random(),
        name: generateActionName(
          bulkActionForm.isCustomAction ? bulkActionForm.customActionName : bulkActionForm.actionPath.split(' > ').pop(),
          asset.id,
          bulkActionForm.nextDue,
          bulkActionForm.overrideDate,
          bulkActionForm.recurrence,
          null,
          '',
          bulkActionForm.isCustomAction
        ),
        assetId: asset.id,
        actionPath: bulkActionForm.isCustomAction ? 'Custom Action' : bulkActionForm.actionPath,
        status: 'Open',
        nextDue: bulkActionForm.nextDue,
        overrideDate: bulkActionForm.overrideDate || null,
        recurrence: bulkActionForm.recurrence,
        recurrenceValue: bulkActionForm.recurrenceValue,
        recurrenceUnit: bulkActionForm.recurrenceUnit,
        assetPercentage: bulkActionForm.assetPercentage,
        adjustmentFactor: bulkActionForm.adjustmentFactor ? parseFloat(bulkActionForm.adjustmentFactor) : null,
        isCustomAction: bulkActionForm.isCustomAction,
        customActionName: bulkActionForm.customActionName,
        customActionCost: bulkActionForm.customActionCost ? parseFloat(bulkActionForm.customActionCost) : null,
        assetSize: asset.size,
        unitOfMeasure: assetTypes[asset.type]?.unit || 'Each',
        modeledCost,
        overrideCost: bulkActionForm.overrideCost ? parseInt(bulkActionForm.overrideCost) : null,
        cost: finalCost,
        createdBy: 'current_user',
        createdDate: new Date().toISOString(),
        projectId: selectedProject.id
      };

      if (bulkActionForm.recurrence) {
        newActions.push(...generateRecurringActions(baseAction, selectedProject));
      } else {
        newActions.push(baseAction);
      }
    });

    // Update the selected project with new actions
    setProjects(prev => prev.map(project => {
      if (project.id === selectedProject.id) {
        const updatedProject = {
          ...project,
          actions: [...project.actions, ...newActions]
        };
        setSelectedProject(updatedProject);
        return updatedProject;
      }
      return project;
    }));

    // Add audit entries
    newActions.forEach(action => {
      addAuditEntry('action', action.id, 'created', null, action.name);
    });

    setShowBulkActionModal(false);
    alert(`Successfully added ${newActions.length} actions to ${matchingAssets.length} assets`);
  };

  const renderBulkActionModal = () => {
    // Get asset types that exist in the selected region
    const getAssetTypesForRegion = (region) => {
      if (!region) return [];
      
      // Find assets in the selected region
      const assetsInRegion = assets.filter(asset => asset.region === region);
      
      // Get unique asset types from those assets
      const assetTypesInRegion = Array.from(new Set(
        assetsInRegion.map(asset => {
          const assetConfig = assetTypes[asset.type];
          return assetConfig ? assetConfig.name : null;
        }).filter(Boolean)
      ));
      
      return assetTypesInRegion.sort();
    };

    // Get asset types for dropdown based on selected region
    const availableAssetTypes = getAssetTypesForRegion(bulkActionForm.region);

    const previewName = generateActionName(
      bulkActionForm.isCustomAction ? bulkActionForm.customActionName : bulkActionForm.actionPath.split(' > ').pop(),
      'BULK',
      bulkActionForm.nextDue,
      bulkActionForm.overrideDate,
      bulkActionForm.recurrence,
      bulkActionForm.region
    );

    // Count matching assets for preview
    const assetClass = Object.values(assetTypes).find(type => type.name === bulkActionForm.assetType)?.assetClass;
    const matchingAssetsCount = assets.filter(asset => {
      const assetConfig = assetTypes[asset.type];
      return asset.region === bulkActionForm.region && assetConfig?.assetClass === assetClass;
    }).length;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Bulk Add Actions</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
              <select
                value={bulkActionForm.region}
                onChange={(e) => setBulkActionForm(prev => ({ 
                  ...prev, 
                  region: e.target.value,
                  assetType: '' // Clear asset type when region changes
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select region...</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type *</label>
              <select
                value={bulkActionForm.assetType}
                onChange={(e) => setBulkActionForm(prev => ({ ...prev, assetType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!bulkActionForm.region}
              >
                <option value="">
                  {bulkActionForm.region ? 'Select asset type...' : 'Select region first...'}
                </option>
                {availableAssetTypes.map(assetType => (
                  <option key={assetType} value={assetType}>{assetType}</option>
                ))}
              </select>
            </div>

            {bulkActionForm.region && bulkActionForm.assetType && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Users className="w-4 h-4 inline mr-2" />
                This will apply to {matchingAssetsCount} asset{matchingAssetsCount !== 1 ? 's' : ''} in {bulkActionForm.region} region
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={bulkActionForm.isCustomAction}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, isCustomAction: e.target.checked, actionPath: '', actionDetails: null }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Use Custom Action</span>
              </label>
            </div>

            {!bulkActionForm.isCustomAction ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowActionSelector(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white hover:bg-gray-50"
                  >
                    {bulkActionForm.actionPath || 'Select action...'}
                  </button>
                  {bulkActionForm.actionDetails && (
                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                      {bulkActionForm.actionDetails.description} - ${bulkActionForm.actionDetails.cost}/{bulkActionForm.actionDetails.unit}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Action Name *</label>
                  <input
                    type="text"
                    value={bulkActionForm.customActionName}
                    onChange={(e) => setBulkActionForm(prev => ({ ...prev, customActionName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom action name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Action Cost *</label>
                  <input
                    type="number"
                    value={bulkActionForm.customActionCost}
                    onChange={(e) => setBulkActionForm(prev => ({ ...prev, customActionCost: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter custom cost"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date *</label>
                <input
                  type="date"
                  value={bulkActionForm.nextDue}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, nextDue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Override Date (Optional)</label>
                <input
                  type="date"
                  value={bulkActionForm.overrideDate}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, overrideDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bulkActionForm.recurrence}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, recurrence: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">This action recurs (will generate for 10-year plan)</span>
              </label>
            </div>

            {bulkActionForm.recurrence && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                <div className="flex gap-2">
                  <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Every</span>
                  <input
                    type="number"
                    min="1"
                    value={bulkActionForm.recurrenceValue}
                    onChange={(e) => setBulkActionForm(prev => ({ ...prev, recurrenceValue: parseInt(e.target.value) || 1 }))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={bulkActionForm.recurrenceUnit}
                    onChange={(e) => setBulkActionForm(prev => ({ ...prev, recurrenceUnit: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="months">months</option>
                    <option value="years">years</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Percentage</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkActionForm.assetPercentage}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, assetPercentage: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter percentage (1-100)"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Percentage of asset size affected by this action
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Factor (Multiplier)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bulkActionForm.adjustmentFactor}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, adjustmentFactor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1.1 for 10% increase"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Simple multiplier to adjust final cost (e.g., 1.2 = 20% increase)
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Override Cost (Optional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={bulkActionForm.overrideCost}
                  onChange={(e) => setBulkActionForm(prev => ({ ...prev, overrideCost: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter override cost"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Leave empty to use calculated cost based on asset size
              </div>
            </div>

            {previewName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview Action Name</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900">
                  {previewName.replace('BULK', '[ASSET_ID]')}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowBulkActionModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={saveBulkActions}
              disabled={
                !bulkActionForm.region ||
                !bulkActionForm.assetType ||
                !bulkActionForm.nextDue ||
                (bulkActionForm.isCustomAction && !bulkActionForm.customActionName) ||
                (!bulkActionForm.isCustomAction && !bulkActionForm.actionPath)
              }
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#5B6ACD' }}
            >
              Create Bulk Actions
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingProject ? 'Edit Project' : 'Add New Project'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              value={projectForm.name}
              onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={projectForm.description}
              onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter project description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
              <select
                value={projectForm.team}
                onChange={(e) => setProjectForm(prev => ({ ...prev, team: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select team...</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
            <select
              value={projectForm.region}
              onChange={(e) => setProjectForm(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select region...</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Status *</label>
              <select
                value={projectForm.fundingStatus}
                onChange={(e) => setProjectForm(prev => ({ ...prev, fundingStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Funded">Funded</option>
                <option value="Unfunded">Unfunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
              <select
                value={projectForm.projectType}
                onChange={(e) => setProjectForm(prev => ({ ...prev, projectType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Renewal/Replacement">Renewal/Replacement</option>
                <option value="Upgrade">Upgrade</option>
                <option value="New Asset">New Asset</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Type *</label>
            <select
              value={projectForm.budgetType}
              onChange={(e) => setProjectForm(prev => ({ ...prev, budgetType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Single Year">Single Year</option>
              <option value="Multi Year">Multi Year</option>
              <option value="Recurring">Recurring</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
            <textarea
              value={projectForm.justification}
              onChange={(e) => setProjectForm(prev => ({ ...prev, justification: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Enter project justification..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={projectForm.startDate}
                onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={projectForm.endDate}
                onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowProjectModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={saveProject}
            disabled={!projectForm.name || !projectForm.team || !projectForm.region || !projectForm.fundingStatus || !projectForm.projectType || !projectForm.budgetType}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#5B6ACD' }}
          >
            {editingProject ? 'Update' : 'Create'} Project
          </button>
        </div>
      </div>
    </div>
  );

  const renderCustomActionForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {editingCustomAction ? 'Edit Custom Action' : 'Add Custom Action'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Name *</label>
            <input
              type="text"
              value={customActionForm.name}
              onChange={(e) => setCustomActionForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter action name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={customActionForm.description}
              onChange={(e) => setCustomActionForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost *</label>
              <input
                type="number"
                value={customActionForm.cost}
                onChange={(e) => setCustomActionForm(prev => ({ ...prev, cost: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter cost"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={customActionForm.unit}
                onChange={(e) => setCustomActionForm(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Each">Each</option>
                <option value="SM">Square Meter</option>
                <option value="Linear Meter">Linear Meter</option>
                <option value="Hour">Hour</option>
                <option value="Day">Day</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lifecycle (Years)</label>
            <input
              type="number"
              value={customActionForm.lifecycle}
              onChange={(e) => setCustomActionForm(prev => ({ ...prev, lifecycle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter lifecycle in years"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowCustomActionForm(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={saveCustomAction}
            disabled={!customActionForm.name || !customActionForm.cost}
            className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#5B6ACD' }}
          >
            {editingCustomAction ? 'Update' : 'Save'} Action
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Error Loading Data</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {renderSidebar()}
      {currentView === 'projects' && renderProjectsList()}
      {currentView === 'project-detail' && renderProjectDetail()}
      {currentView === 'capital-plan' && renderCapitalPlan()}
      {currentView === 'assets' && <div className="flex-1 p-6">Assets view coming soon...</div>}
      {currentView === 'reporting' && <div className="flex-1 p-6">Reporting view coming soon...</div>}
      {showActionModal && renderActionModal()}
      {showBulkActionModal && renderBulkActionModal()}
      {showProjectModal && renderProjectModal()}
      {showActionSelector && renderActionSelector()}
      {showCustomActionForm && renderCustomActionForm()}
    </div>
  );
};

export default ProjectsActionsModule;