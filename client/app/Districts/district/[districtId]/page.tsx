import styles from './page.module.css';
import Header from '@/components/Header';

type PageProps = {
    params: {
        districtId: string;
        locationId: string;
    };
};

export default async function districtPage({ params }: PageProps) {
    const { districtId } = await params;

    return (
        <div className = {styles.pageDiv}>
            <Header />

            <h1>District {districtId}</h1>
        </div>
    );
}