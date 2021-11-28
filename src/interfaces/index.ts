import { Moment } from 'moment';

export interface IFileUploadStatus {
	status: 'pending' | 'ready' | 'wrongFormat' | 'wrongExtension'
}

export interface IEmployeeData {
	EmpID: number,
	ProjectID: number,
	DateFrom: Moment,
	DateTo: Moment
}

export interface IEmployeesDataRow {
	id: number
	firstEmployeeId: number,
	secondEmployeeId: number,
	pids: string,
	days: number
}

export interface IEmployeeMatch {
	firstEmployeeId: number,
	secondEmployeeId: number,
	projectId: number[],
	days: number
}