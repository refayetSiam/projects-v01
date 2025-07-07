import Papa from 'papaparse';

export const loadCSV = async (filePath) => {
  try {
    const response = await fetch(filePath);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error loading CSV file ${filePath}:`, error);
    throw error;
  }
};

export const loadAllData = async () => {
  try {
    const [
      assetTypesData,
      costDatabaseData,
      assetsData,
      projectsData,
      actionsData,
      auditTrailData,
      teamsData,
      regionsData
    ] = await Promise.all([
      loadCSV('/data/asset-types.csv'),
      loadCSV('/data/cost-database.csv'),
      loadCSV('/data/assets.csv'),
      loadCSV('/data/projects.csv'),
      loadCSV('/data/actions.csv'),
      loadCSV('/data/audit-trail.csv'),
      loadCSV('/data/teams.csv'),
      loadCSV('/data/regions.csv')
    ]);

    // Transform asset types data
    const assetTypes = {};
    assetTypesData.forEach(row => {
      assetTypes[row.code] = {
        name: row.name,
        unit: row.unit,
        prefix: row.prefix,
        assetClass: row.assetClass
      };
    });

    // Transform cost database data
    const costDatabase = {};
    costDatabaseData.forEach(row => {
      if (!costDatabase[row.assetClass]) {
        costDatabase[row.assetClass] = {};
      }
      if (!costDatabase[row.assetClass][row.assetType]) {
        costDatabase[row.assetClass][row.assetType] = {};
      }
      costDatabase[row.assetClass][row.assetType][row.actionName] = {
        cost: parseFloat(row.cost),
        unit: row.unit,
        description: row.description,
        lifecycle: row.lifecycle
      };
    });

    // Transform assets data
    const assets = assetsData.map(row => ({
      ...row,
      size: parseFloat(row.size),
      expectedLifespan: parseInt(row.expectedLifespan),
      conditionScore: parseInt(row.conditionScore)
    }));

    // Transform projects data
    const projects = projectsData.map(row => ({
      ...row,
      id: parseInt(row.id),
      completion: parseInt(row.completion),
      actions: []
    }));

    // Transform actions data and attach to projects
    const actions = actionsData.map(row => ({
      ...row,
      id: parseInt(row.id),
      projectId: parseInt(row.projectId),
      recurrence: row.recurrence === 'true',
      recurrenceValue: row.recurrenceValue ? parseInt(row.recurrenceValue) : null,
      assetPercentage: parseInt(row.assetPercentage),
      modeledCost: parseInt(row.modeledCost),
      overrideCost: row.overrideCost ? parseInt(row.overrideCost) : null,
      cost: parseInt(row.cost)
    }));

    // Attach actions to projects
    projects.forEach(project => {
      project.actions = actions.filter(action => action.projectId === project.id);
    });

    // Transform audit trail data
    const auditTrail = auditTrailData.map(row => ({
      ...row,
      id: parseInt(row.id),
      entityId: parseInt(row.entityId)
    }));

    // Transform teams and regions arrays
    const teams = teamsData.map(row => row.name);
    const regions = regionsData.map(row => row.name);

    return {
      assetTypes,
      costDatabase,
      assets,
      projects,
      auditTrail,
      teams,
      regions
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};