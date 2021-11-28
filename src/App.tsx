// Vendor
import React, { useEffect, useState } from 'react';
import { DataGrid, GridSortModel } from '@mui/x-data-grid';
// Custom
import { IFileUploadStatus, IEmployeeData, IEmployeesDataRow, IEmployeeMatch } from './interfaces/'
import { isOverlapingPeriod, getOveralpingDays, normalizeStringDate } from './global/helpers'
// Styles
import './styles/app.css'

function App() {
	// Initiate state

	// File manipulation
	const [uploadStatus, setUploadStatus] = useState<IFileUploadStatus>({status: 'pending'})
	const [fileReady, setFileReady] = useState(false)
	const [fileName, setFileName] = useState('No file chosen...')
	// Data manipulation
	const [parsedData, setParsedData] = useState<IEmployeeData[]>([])
	const [gridRows, setGridRows] = useState<IEmployeesDataRow[]>([])
	const [matchingPeriods, setMatchingPeriods] = useState<IEmployeeMatch[]>([])
	// Data render
	const [sortModel, setSortModel] = React.useState<GridSortModel>([
		{
			field: 'days',
			sort: 'desc',
		},
	  ]);

	const gridColumns = [
		{ field: 'firstEmployeeId', headerName: 'Employee ID #1', width: 200 },
		{ field: 'secondEmployeeId', headerName: 'Employee ID #2', width: 200 },
		{ field: 'pids', headerName: 'Project ID', width: 150 },
		{ field: 'days', headerName: 'Days worked', flex: 130 },
	]

	// Read the loaded file as text 
	// then parse the result 
	// and set it as state
	const readFile = async (e: any) => {
		const uploadedFile = e.target.value ? true : false;
	
		if(uploadStatus.status === 'ready' && uploadedFile) {
			setUploadStatus({status: 'pending'})
			setParsedData([])
			setGridRows([])
			setMatchingPeriods([])
			setFileReady(false)
			parseFile(e)
		} else {
			parseFile(e)
		}
		
	}

	const parseFile = (e: any) => {
		// Get the uploaded file extension
		const uploadedFileName = e.target.value.match(/[^\\/]+$/)[0];
		const uploadedFileExtension = e.target.value ? e.target.value.match(/\.([^.]+)$/)[1] : '';

		// If it is the proper format continue running, otherwise display error message
		if(uploadedFileExtension !== 'txt') {
			setUploadStatus({status: 'wrongExtension'})
		} else {
			setUploadStatus({status: 'ready'})
			setFileName(uploadedFileName)
			const reader = new FileReader()

			reader.onload = async (e: any) => {
				const text = (e.target.result)
	
				// Split the raw text data by new line regardless of the 
				// origin OS' specificity
				const rawData = text.split(/\r\n|\r|\n/g)
				// Save the already parsed data to the state
				setParsedData(ParseData(rawData))
				setFileReady(true)
			}
			
			reader.readAsText(e.target.files[0])
		}
	}

	// "data" input should  be a row of the Employee project file
	// the row should be using "," as a delimiter (similar to csv type files)
	const ParseData = (data: string[]) => {
		let result: IEmployeeData[] = []

		data.forEach( (row: string) => {
			let temp = row.split(',')

			// Only include rows with the required data segments amount
			if(temp.length === 4) {
				result.push(
					{ 
						EmpID: parseInt(temp[0]),
						ProjectID: parseInt(temp[1]),
						DateFrom: normalizeStringDate(temp[2]),
						DateTo: normalizeStringDate(temp[3])
					}
				)
			}
		})

		return result
	}

	const updateMatchingPeriods = () => {
		// Get all project ids
		const allProjectsIds = parsedData.map( (row: IEmployeeData, index) => row.ProjectID)
		const uniqueProjectsIds = [...new Set(allProjectsIds)]

		let overlaps: IEmployeeMatch[] = []

		// Go trough all uniques project ID
		uniqueProjectsIds.forEach( (id: number) => {
			// Get the EmployeeDataRow for the given ID
			const currentProjectWithId = parsedData.filter( (row: IEmployeeData ) => row.ProjectID === id)
			
			// Check the the projects with the same id if there are overlapping periods
			// Checks all projects for the currentId agains each other of the same ID
			for(let i = 0; i < currentProjectWithId.length; i++) {
				const dataRow = currentProjectWithId[i]
				for(let b = i; b < currentProjectWithId.length; b++) {
					const dataRow2 = currentProjectWithId[b]

					// Checks if there the periods match
					if(
						isOverlapingPeriod(
							dataRow.DateFrom, 
							dataRow.DateTo, 
							dataRow2.DateFrom, 
							dataRow2.DateTo
						) 
							&& dataRow.EmpID !== dataRow2.EmpID
					) {
								
						// Get the overlap period in days
						const dayDifference = getOveralpingDays(
							dataRow.DateFrom, 
							dataRow.DateTo, 
							dataRow2.DateFrom, 
							dataRow2.DateTo
						) || 0
						
						// Normalize the employees ids for further checks
						const firstEmployee = dataRow.EmpID < dataRow2.EmpID ? dataRow.EmpID : dataRow2.EmpID 
						const secondEmployee = dataRow.EmpID > dataRow2.EmpID ? dataRow.EmpID : dataRow2.EmpID 
						// Build a matchingPeriod data row
						const matchingPeriod = { firstEmployeeId: firstEmployee, secondEmployeeId: secondEmployee, projectId: [dataRow.ProjectID], days: dayDifference }

						// Check if the given employee pair has already been added
						const employeePairIndex = overlaps.findIndex( (element: IEmployeeMatch) => (
							element.firstEmployeeId === matchingPeriod.firstEmployeeId &&
							element.secondEmployeeId === matchingPeriod.secondEmployeeId
						))

						// If the pair does not exist: add it
						// If the pair does exist, check if the data row is the same by comparing project IDs
						if( employeePairIndex < 0 ) {
							overlaps.push(matchingPeriod)
						} else {
							let existingPair = overlaps[employeePairIndex]

							if( existingPair.projectId.toString() !== matchingPeriod.projectId.toString()) {
								overlaps[employeePairIndex] = { ...existingPair, projectId: existingPair.projectId.concat(matchingPeriod.projectId.filter((item) => existingPair.projectId.indexOf(item) < 0)), days: existingPair.days + matchingPeriod.days }
							}
						}
					}
				}
			}
		})

		setMatchingPeriods(overlaps)
	}

	// Start the employee matching if the file is ready
	useEffect(() => {
		if(fileReady) {
			console.log('Upload done');
			updateMatchingPeriods()
		} else {
			console.log('Waiting for upload');
		}

	}, [fileReady])

	// When the matching data changes
	// Try to render the datagrid
	useEffect(() => {
		if(matchingPeriods) {
			let newRows: IEmployeesDataRow[] = []

			matchingPeriods.forEach( (row: IEmployeeMatch, index) => {
				newRows = [ ...newRows, { id: index, firstEmployeeId: row.firstEmployeeId, secondEmployeeId: row.secondEmployeeId, pids: row.projectId.toString(), days: row.days }]
			})

			setGridRows(newRows)
		}

	}, [matchingPeriods])

	return (
		<main>
			<h2> Team Longest Period </h2>

			<div className='file-wrapper'>
				{/* <input type="file" accept=".txt" onChange={(e) => readFile(e)} /> */}

				<div className="file-upload">
					<div className="file-select">
						<div className="file-select-button" id="fileName">Choose File</div>
						<div className="file-select-name" id="noFile"> {fileName} </div> 
						<input type="file" accept=".txt" onChange={(e) => readFile(e)} name="chooseFile" id="chooseFile" />
					</div>
				</div>

			</div>

			{
				uploadStatus.status !== 'wrongExtension' && fileReady ? (
					<div style={{ height: 400, width: '80vw', margin: 'auto' }}>
						<DataGrid 
							rows={gridRows} 
							columns={gridColumns} 
							pageSize={10} 
							sortModel={sortModel} 
							onSortModelChange={(model) => setSortModel(model)}
							disableSelectionOnClick
						/>
					</div>
				) : (
					<div>
						Please upload a .txt file
					</div>
				)
			}

			{
				uploadStatus.status === 'wrongExtension' && (
					<div>
						The uploaded file is in a wrong format. Please upload a ".txt" file.
					</div>
				)
			}
			
		</main>
	);
}

export default App;